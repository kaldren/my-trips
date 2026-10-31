-- Editing, archiving and deleting trips: update_trip, replace_trip_visits,
-- archived_at, and ownership isolation for each.
-- User A owns a public trip with two photos and two places; user B owns one.
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

insert into public.trips (id, user_id, title, start_date, end_date, visibility) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A trip', '2026-03-03', '2026-03-06', 'public'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B trip', '2026-05-01', '2026-05-03', 'private');

insert into public.visits (trip_id, user_id, name, label, lng, lat, position) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lisbon', 'Lisbon, Portugal', -9.14, 38.72, 0),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Porto', 'Porto, Portugal', -8.61, 41.15, 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Sofia', 'Sofia, Bulgaria', 23.32, 42.70, 0);

insert into public.trip_photos (trip_id, user_id, storage_path, is_cover, position) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a/t/p1.webp', true, 0),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a/t/p2.webp', false, 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b/t/p1.webp', true, 0);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- Another signed-in user (B) cannot change A's public trip
-- ---------------------------------------------------------------------------

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

select throws_ok(
  $$ select public.update_trip('aaaaaaaa-0000-0000-0000-000000000001', 'Hijacked',
       '2026-03-03', '2026-03-06', null, 'public', '[]'::jsonb) $$,
  'P0002', null, 'other users cannot update_trip a trip they can read');

select throws_ok(
  $$ select public.replace_trip_visits('aaaaaaaa-0000-0000-0000-000000000001', '[]'::jsonb) $$,
  'P0002', null, 'other users cannot replace visits of a trip they can read');

-- Claiming another user's photo path from your own trip must not touch it,
-- whether the call fails or skips the row.
do $$
begin
  perform public.update_trip('bbbbbbbb-0000-0000-0000-000000000001', 'B trip',
    '2026-05-01', '2026-05-03', null, 'private',
    '[{"path":"a/t/p1.webp","isCover":true}]'::jsonb);
exception when others then null;
end;
$$;
select results_eq(
  $$ select trip_id, position, is_cover from public.trip_photos where storage_path = 'a/t/p1.webp' $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 0, true) $$,
  'update_trip cannot take over another user''s photo');

update public.trips set archived_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select is(
  (select title from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'A trip', 'a failed update_trip by another user changes nothing');

select is(
  (select count(*)::int from public.visits where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  2, 'a failed replace_trip_visits by another user removes nothing');

select is(
  (select count(*)::int from public.trip_photos where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  2, 'a failed update_trip by another user removes no photos');

select is(
  (select archived_at from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  null, 'other users cannot archive a trip they can read');

-- ---------------------------------------------------------------------------
-- Owner (A)
-- ---------------------------------------------------------------------------

-- Drop p1, keep p2 first, add p3 as the new cover.
select is(
  (select array_agg(p) from public.update_trip(
     'aaaaaaaa-0000-0000-0000-000000000001', 'A trip (edited)',
     '2026-03-04', '2026-03-08', 'Great food', 'private',
     '[{"path":"a/t/p2.webp","isCover":false},{"path":"a/t/p3.webp","isCover":true}]'::jsonb) as p),
  array['a/t/p1.webp'], 'update_trip returns the storage paths it removed');

select results_eq(
  $$ select title, start_date, end_date, message, visibility::text
       from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  $$ values ('A trip (edited)', '2026-03-04'::date, '2026-03-08'::date, 'Great food', 'private') $$,
  'update_trip saves the trip details');

select results_eq(
  $$ select storage_path, is_cover, position from public.trip_photos
      where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001' order by position $$,
  $$ values ('a/t/p2.webp', false, 0), ('a/t/p3.webp', true, 1) $$,
  'update_trip reorders, adds photos and moves the cover');

select lives_ok(
  $$ select public.update_trip('aaaaaaaa-0000-0000-0000-000000000001', 'A trip (edited)',
       '2026-03-04', '2026-03-08', 'Great food', 'private',
       '[{"path":"a/t/p3.webp","isCover":true},{"path":"a/t/p2.webp","isCover":false}]'::jsonb) $$,
  'update_trip can swap photo positions');

select throws_ok(
  $$ select public.update_trip('aaaaaaaa-0000-0000-0000-000000000001', 'A trip (edited)',
       '2026-03-04', '2026-03-08', null, 'private',
       '[{"path":"a/t/p2.webp","isCover":true},{"path":"a/t/p3.webp","isCover":true}]'::jsonb) $$,
  '23505', null, 'update_trip keeps at most one cover');

select throws_ok(
  $$ select public.update_trip('aaaaaaaa-0000-0000-0000-000000000001', 'A trip (edited)',
       '2026-03-08', '2026-03-04', null, 'private', '[]'::jsonb) $$,
  '23514', null, 'update_trip still enforces date order');

select lives_ok(
  $$ select public.update_trip('aaaaaaaa-0000-0000-0000-000000000001', 'A trip (edited)',
       '2026-03-04', '2026-03-08', null, 'private', '[]'::jsonb) $$,
  'update_trip can remove every photo');

select is(
  (select count(*)::int from public.trip_photos where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0, 'removing every photo leaves the trip without photos');

select lives_ok(
  $$ select public.replace_trip_visits('aaaaaaaa-0000-0000-0000-000000000001',
       '[{"name":"Porto","label":"Porto, Portugal","lng":-8.61,"lat":41.15,"providerId":"p"},
         {"name":"Lisbon","label":"Lisbon, Portugal","lng":-9.14,"lat":38.72}]'::jsonb) $$,
  'owner can replace the places on own trip');

select results_eq(
  $$ select name, position, provider_id from public.visits
      where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001' order by position $$,
  $$ values ('Porto', 0, 'p'), ('Lisbon', 1, null) $$,
  'replace_trip_visits stores places in the given order');

update public.trips set archived_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select isnt(
  (select archived_at from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  null, 'owner can archive own trip');

update public.trips set archived_at = null where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select archived_at from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  null, 'owner can unarchive own trip');

-- ---------------------------------------------------------------------------
-- Signed out (anon)
-- ---------------------------------------------------------------------------

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select public.replace_trip_visits('aaaaaaaa-0000-0000-0000-000000000001', '[]'::jsonb) $$,
  '42501', null, 'anon cannot call replace_trip_visits');

-- ---------------------------------------------------------------------------
-- Delete
-- ---------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select public.update_trip('aaaaaaaa-0000-0000-0000-000000000001', 'A trip (edited)',
       '2026-03-04', '2026-03-08', null, 'private',
       '[{"path":"a/t/p4.webp","isCover":true}]'::jsonb) $$,
  'owner can add a photo back');

delete from public.trips where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.trip_photos where trip_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0, 'deleting a trip removes its photo rows');

select * from finish();
rollback;
