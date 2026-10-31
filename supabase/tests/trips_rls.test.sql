-- RLS for trips, visits, trip_photos and the trip-photos storage bucket.
-- User A owns a public and a private trip; user B owns one trip.
begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

insert into public.trips (id, user_id, title, start_date, end_date, visibility) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A public', '2026-03-03', '2026-03-06', 'public'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'A private', '2026-04-01', '2026-04-02', 'private'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B trip', '2026-05-01', '2026-05-03', 'private');

insert into public.visits (id, trip_id, user_id, name, label, lng, lat, position) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lisbon', 'Lisbon, Portugal', -9.14, 38.72, 0),
  ('aaaaaaaa-1111-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Porto', 'Porto, Portugal', -8.61, 41.15, 0),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Sofia', 'Sofia, Bulgaria', 23.32, 42.70, 0);

insert into public.trip_photos (id, trip_id, user_id, storage_path, is_cover, position) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/p1.webp', true, 0),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000002/p1.webp', true, 0),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222/bbbbbbbb-0000-0000-0000-000000000001/p1.webp', true, 0);

insert into storage.objects (bucket_id, name, owner) values
  ('trip-photos', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/p1.webp', '11111111-1111-1111-1111-111111111111'),
  ('trip-photos', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000002/p1.webp', '11111111-1111-1111-1111-111111111111');

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- Owner (A)
-- ---------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select is(
  (select count(*)::int from public.trips where user_id = '11111111-1111-1111-1111-111111111111'),
  2, 'owner sees both own trips, public and private');

select lives_ok(
  $$ insert into public.trips (title, start_date, end_date) values ('New', '2026-06-01', '2026-06-02') $$,
  'owner can create a trip (user_id defaults to auth.uid())');

select is(
  (select visibility::text from public.trips where title = 'New'),
  'public', 'new trips are public by default');

select throws_ok(
  $$ insert into public.trips (user_id, title, start_date, end_date)
     values ('22222222-2222-2222-2222-222222222222', 'Forged', '2026-06-01', '2026-06-02') $$,
  '42501', null, 'owner cannot create a trip for another user');

update public.trips set title = 'A public (edited)' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select title from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'A public (edited)', 'owner can update own trip');

select lives_ok(
  $$ insert into public.visits (trip_id, name, label, lng, lat, position)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'Sintra', 'Sintra, Portugal', -9.39, 38.80, 1) $$,
  'owner can add a visit to own trip');

select throws_ok(
  $$ insert into public.trip_photos (trip_id, storage_path, is_cover, position)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'x/y/second-cover.webp', true, 1) $$,
  '23505', null, 'a trip has at most one cover photo');

select throws_ok(
  $$ insert into public.trips (title, start_date, end_date) values ('Backwards', '2026-06-05', '2026-06-01') $$,
  '23514', null, 'end date cannot be before start date');

-- ---------------------------------------------------------------------------
-- Another signed-in user (B)
-- ---------------------------------------------------------------------------

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

select is(
  (select count(*)::int from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1, 'other users can read a public trip');

select is(
  (select count(*)::int from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0, 'other users cannot read a private trip');

select is(
  (select count(*)::int from public.visits where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  2, 'other users can read visits of a public trip');

select is(
  (select count(*)::int from public.visits where trip_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0, 'other users cannot read visits of a private trip');

select is(
  (select count(*)::int from public.trip_photos where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1, 'other users can read photos of a public trip');

select is(
  (select count(*)::int from public.trip_photos where trip_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0, 'other users cannot read photos of a private trip');

update public.trips set title = 'Hijacked' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select title from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'A public (edited)', 'other users cannot update a trip they can read');

delete from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1, 'other users cannot delete a trip they can read');

select throws_ok(
  $$ insert into public.visits (trip_id, name, label, lng, lat, position)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'Intruder', 'Nowhere', 0, 0, 9) $$,
  '42501', null, 'cannot attach a visit to another user''s trip');

select throws_ok(
  $$ update public.visits set trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     where id = 'bbbbbbbb-1111-0000-0000-000000000001' $$,
  '42501', null, 'cannot move own visit to another user''s trip');

select throws_ok(
  $$ insert into public.trip_photos (trip_id, storage_path, position)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'x/y/intruder.webp', 9) $$,
  '42501', null, 'cannot attach a photo to another user''s trip');

select throws_ok(
  $$ update public.trip_photos set trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     where id = 'bbbbbbbb-2222-0000-0000-000000000001' $$,
  '42501', null, 'cannot move own photo to another user''s trip');

-- Storage
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('trip-photos', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/evil.webp', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'cannot upload into another user''s folder');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('trip-photos', '22222222-2222-2222-2222-222222222222/aaaaaaaa-0000-0000-0000-000000000001/evil.webp', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'cannot upload into a trip folder you do not own');

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('trip-photos', '22222222-2222-2222-2222-222222222222/bbbbbbbb-0000-0000-0000-000000000001/ok.webp', '22222222-2222-2222-2222-222222222222') $$,
  'can upload into own trip folder');

select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'trip-photos' and name like '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/%'),
  1, 'other users can read photo objects of a public trip');

select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'trip-photos' and name like '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000002/%'),
  0, 'other users cannot read photo objects of a private trip');

-- ---------------------------------------------------------------------------
-- Signed out (anon)
-- ---------------------------------------------------------------------------

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::int from public.trips where user_id = '11111111-1111-1111-1111-111111111111'),
  2, 'anon sees only public trips (A public + New)');

select is(
  (select count(*)::int from public.trips where visibility = 'private'),
  0, 'anon cannot read any private trip');

select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'trip-photos' and name like '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/%'),
  1, 'anon can read photo objects of a public trip');

select throws_ok(
  $$ insert into public.trips (title, start_date, end_date) values ('Anon', '2026-06-01', '2026-06-02') $$,
  '42501', null, 'anon cannot create trips');

-- ---------------------------------------------------------------------------
-- Cascade
-- ---------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
delete from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000002';
select is(
  (select count(*)::int from public.visits where trip_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0, 'deleting a trip removes its visits');

select * from finish();
rollback;
