-- Trips, their visited places (visits), and their photos.
--
-- Visibility rule: a trip is readable when it is public or owned by the caller.
-- Child rows (visits, trip_photos, storage objects) are readable exactly when
-- their parent trip is, by checking the trip through its own RLS policy.
-- Writes always require owning the parent trip, which also blocks attaching
-- or moving a child row to someone else's trip.

-- ---------------------------------------------------------------------------
-- Types and helpers
-- ---------------------------------------------------------------------------

create type public.trip_visibility as enum ('public', 'private');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  start_date date not null,
  end_date date not null,
  message text check (message is null or char_length(message) <= 280),
  visibility public.trip_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_ordered check (end_date >= start_date)
);

create index trips_user_id_start_date_idx on public.trips (user_id, start_date desc);
create index trips_public_start_date_idx on public.trips (start_date desc)
  where visibility = 'public';

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

create policy "Public trips and own trips are readable"
  on public.trips for select
  to anon, authenticated
  using (visibility = 'public' or user_id = (select auth.uid()));

create policy "Users create their own trips"
  on public.trips for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own trips"
  on public.trips for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users delete their own trips"
  on public.trips for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- visits: a place visited on a trip
-- ---------------------------------------------------------------------------

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  label text not null check (char_length(label) between 1 and 300),
  lng double precision not null check (lng between -180 and 180),
  lat double precision not null check (lat between -90 and 90),
  provider_id text,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  constraint visits_trip_position_key unique (trip_id, position) deferrable initially immediate
);

create index visits_user_id_idx on public.visits (user_id);

alter table public.visits enable row level security;

create policy "Visits of readable trips are readable"
  on public.visits for select
  to anon, authenticated
  using (exists (select 1 from public.trips t where t.id = visits.trip_id));

create policy "Users add visits to their own trips"
  on public.visits for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = visits.trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "Users update visits on their own trips"
  on public.visits for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = visits.trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "Users delete their own visits"
  on public.visits for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- trip_photos: gallery rows pointing at objects in the trip-photos bucket
-- ---------------------------------------------------------------------------

create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null unique,
  is_cover boolean not null default false,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  constraint trip_photos_trip_position_key unique (trip_id, position) deferrable initially immediate
);

create unique index trip_photos_one_cover_per_trip_idx on public.trip_photos (trip_id)
  where is_cover;
create index trip_photos_user_id_idx on public.trip_photos (user_id);

alter table public.trip_photos enable row level security;

create policy "Photos of readable trips are readable"
  on public.trip_photos for select
  to anon, authenticated
  using (exists (select 1 from public.trips t where t.id = trip_photos.trip_id));

create policy "Users add photos to their own trips"
  on public.trip_photos for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = trip_photos.trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "Users update photos on their own trips"
  on public.trip_photos for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = trip_photos.trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "Users delete their own photos"
  on public.trip_photos for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants. RLS decides which rows; these decide which operations reach RLS.
-- ---------------------------------------------------------------------------

grant usage on type public.trip_visibility to anon, authenticated;
grant select on public.trips, public.visits, public.trip_photos to anon;
grant select, insert, update, delete
  on public.trips, public.visits, public.trip_photos to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket, objects at {user_id}/{trip_id}/{file}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-photos',
  'trip-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Trip photos are readable when the trip is"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'trip-photos'
    and exists (
      select 1 from public.trips t
      where t.id::text = (storage.foldername(name))[2]
    )
  );

create policy "Users upload photos to their own trips"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trip-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.trips t
      where t.id::text = (storage.foldername(name))[2]
        and t.user_id = (select auth.uid())
    )
  );

create policy "Users delete photos from their own trips"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trip-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.trips t
      where t.id::text = (storage.foldername(name))[2]
        and t.user_id = (select auth.uid())
    )
  );
