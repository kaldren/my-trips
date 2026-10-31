-- Editing, archiving and deleting trips.
--
-- Archiving only hides a trip from its owner's main list; it does not change
-- who can read it. Deleting uses the existing delete policies and cascades.
--
-- The two functions below are SECURITY INVOKER, so every statement in them
-- runs under the caller's RLS policies. They exist to make multi-row edits
-- atomic, which PostgREST cannot do across separate requests. Each one also
-- checks ownership up front so that a trip hidden by RLS raises an error
-- instead of silently changing nothing.

alter table public.trips add column archived_at timestamptz;

-- ---------------------------------------------------------------------------
-- update_trip: trip details plus the full, ordered photo list in one go.
-- Returns the storage paths of photo rows it removed, so the caller can
-- delete those objects from Storage.
-- ---------------------------------------------------------------------------

create function public.update_trip(
  p_trip_id uuid,
  p_title text,
  p_start_date date,
  p_end_date date,
  p_message text,
  p_visibility public.trip_visibility,
  p_photos jsonb
)
returns setof text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_photos) is distinct from 'array' then
    raise exception 'p_photos must be a JSON array' using errcode = '22023';
  end if;

  update public.trips
     set title = p_title,
         start_date = p_start_date,
         end_date = p_end_date,
         message = nullif(p_message, ''),
         visibility = p_visibility
   where id = p_trip_id
     and user_id = (select auth.uid());
  if not found then
    raise exception 'trip not found' using errcode = 'P0002';
  end if;

  -- Positions are renumbered below; check uniqueness once, at commit.
  set constraints public.trip_photos_trip_position_key deferred;

  -- The one-cover index cannot be deferred, so clear covers before
  -- assigning the new one.
  update public.trip_photos
     set is_cover = false
   where trip_id = p_trip_id
     and is_cover;

  return query
    delete from public.trip_photos tp
     where tp.trip_id = p_trip_id
       and not exists (
         select 1 from jsonb_array_elements(p_photos) as e(value)
          where e.value ->> 'path' = tp.storage_path
       )
    returning tp.storage_path;

  insert into public.trip_photos (trip_id, user_id, storage_path, is_cover, position)
  select p_trip_id,
         (select auth.uid()),
         e.value ->> 'path',
         coalesce((e.value ->> 'isCover')::boolean, false),
         (e.ord - 1)::integer
    from jsonb_array_elements(p_photos) with ordinality as e(value, ord)
  on conflict (storage_path) do update
     set is_cover = excluded.is_cover,
         position = excluded.position
   where public.trip_photos.trip_id = excluded.trip_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- replace_trip_visits: swap a trip's places for a new ordered list.
-- ---------------------------------------------------------------------------

create function public.replace_trip_visits(p_trip_id uuid, p_visits jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_visits) is distinct from 'array' then
    raise exception 'p_visits must be a JSON array' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.trips t
     where t.id = p_trip_id and t.user_id = (select auth.uid())
  ) then
    raise exception 'trip not found' using errcode = 'P0002';
  end if;

  delete from public.visits where trip_id = p_trip_id;

  insert into public.visits (trip_id, user_id, name, label, lng, lat, provider_id, position)
  select p_trip_id,
         (select auth.uid()),
         e.value ->> 'name',
         e.value ->> 'label',
         (e.value ->> 'lng')::double precision,
         (e.value ->> 'lat')::double precision,
         e.value ->> 'providerId',
         (e.ord - 1)::integer
    from jsonb_array_elements(p_visits) with ordinality as e(value, ord);
end;
$$;

-- Signed-in users only. Supabase grants EXECUTE to anon by default.
revoke execute on function public.update_trip(uuid, text, date, date, text, public.trip_visibility, jsonb)
  from public, anon;
revoke execute on function public.replace_trip_visits(uuid, jsonb) from public, anon;
grant execute on function public.update_trip(uuid, text, date, date, text, public.trip_visibility, jsonb)
  to authenticated;
grant execute on function public.replace_trip_visits(uuid, jsonb) to authenticated;
