-- The country of each visited place, and a count of a user's countries.
--
-- country_code is the ISO 3166-1 alpha-2 code from geocoding, upper case.
-- Places saved before this migration have none and are not counted until
-- they are picked again from place search.

alter table public.visits
  add column country_code text check (country_code ~ '^[A-Z]{2}$');

-- ---------------------------------------------------------------------------
-- replace_trip_visits: unchanged except that it also stores country_code.
-- ---------------------------------------------------------------------------

create or replace function public.replace_trip_visits(p_trip_id uuid, p_visits jsonb)
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

  insert into public.visits
    (trip_id, user_id, name, label, lng, lat, provider_id, country_code, position)
  select p_trip_id,
         (select auth.uid()),
         e.value ->> 'name',
         e.value ->> 'label',
         (e.value ->> 'lng')::double precision,
         (e.value ->> 'lat')::double precision,
         e.value ->> 'providerId',
         upper(nullif(e.value ->> 'countryCode', '')),
         (e.ord - 1)::integer
    from jsonb_array_elements(p_visits) with ordinality as e(value, ord);
end;
$$;

-- ---------------------------------------------------------------------------
-- count_visited_countries: distinct countries across a user's trips.
--
-- SECURITY INVOKER, so it only counts trips the caller can read: the owner
-- gets every trip, everyone else gets the user's public trips.
-- ---------------------------------------------------------------------------

create function public.count_visited_countries(p_user_id uuid)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(distinct v.country_code)::integer
    from public.visits v
    join public.trips t on t.id = v.trip_id
   where t.user_id = p_user_id
     and v.country_code is not null;
$$;

revoke execute on function public.count_visited_countries(uuid) from public, anon;
grant execute on function public.count_visited_countries(uuid) to authenticated;
