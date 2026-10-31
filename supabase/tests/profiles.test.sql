-- Profiles RLS, profile creation at sign-up, and delete_account().
-- User A has a trip with a place and a photo; user B has nothing else.
begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com', '{"full_name":"  Ana Silva  "}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com', '{"name":"Bo"}'),
  ('33333333-3333-3333-3333-333333333333', 'c@example.com', '{}');

select results_eq(
  $$ select id, display_name from public.profiles
      where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333') order by id $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 'Ana Silva'),
            ('22222222-2222-2222-2222-222222222222'::uuid, 'Bo'),
            ('33333333-3333-3333-3333-333333333333'::uuid, null) $$,
  'signing up creates a profile named after the account');

update public.profiles set bio = 'A bio', age = 30, location = 'Sofia'
 where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set bio = 'B bio'
 where id = '22222222-2222-2222-2222-222222222222';

insert into public.trips (id, user_id, title, start_date, end_date, visibility) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A trip', '2026-03-03', '2026-03-06', 'public');

insert into public.visits (trip_id, user_id, name, label, lng, lat, position) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lisbon', 'Lisbon, Portugal', -9.14, 38.72, 0);

insert into public.trip_photos (trip_id, user_id, storage_path, is_cover, position) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a/t/p1.webp', true, 0);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- Reading: every signed-in user, nobody signed out
-- ---------------------------------------------------------------------------

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

select results_eq(
  $$ select display_name, bio, age::int, location from public.profiles
      where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Ana Silva', 'A bio', 30, 'Sofia') $$,
  'signed-in users can read other users'' profiles');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select count(*) from public.profiles $$, '42501', null, 'anon cannot read profiles');

-- ---------------------------------------------------------------------------
-- Writing: owner only
-- ---------------------------------------------------------------------------

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

update public.profiles set bio = 'Hijacked' where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select bio from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'A bio', 'users cannot update another user''s profile');

select throws_ok(
  $$ insert into public.profiles (id, bio) values ('11111111-1111-1111-1111-111111111111', 'Hijacked')
     on conflict (id) do update set bio = excluded.bio $$,
  '42501', null, 'users cannot upsert another user''s profile');

select throws_ok(
  $$ update public.profiles set id = '33333333-3333-3333-3333-333333333333'
      where id = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null, 'users cannot move their profile onto another user');

delete from public.profiles where id = '22222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  1, 'users cannot delete their profile row directly');

select throws_ok(
  $$ select public.create_profile_for_new_user() $$, '42501', null,
  'users cannot call the sign-up trigger function');

-- ---------------------------------------------------------------------------
-- Owner edits
-- ---------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ update public.profiles
        set display_name = 'Ana', bio = 'New bio', age = 31, location = 'Plovdiv'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  'owner can update own profile');

select results_eq(
  $$ select display_name, bio, age::int, location from public.profiles
      where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Ana', 'New bio', 31, 'Plovdiv') $$,
  'owner''s changes are saved');

select throws_ok(
  $$ update public.profiles set age = 5 where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'age must be at least 13');

select throws_ok(
  $$ update public.profiles set bio = repeat('x', 281) where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'bio is at most 280 characters');

select throws_ok(
  $$ update public.profiles set display_name = repeat('x', 61) where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'display name is at most 60 characters');

select lives_ok(
  $$ update public.profiles set display_name = null, bio = null, age = null, location = null
      where id = '11111111-1111-1111-1111-111111111111' $$,
  'every profile field can be cleared');

-- ---------------------------------------------------------------------------
-- delete_account
-- ---------------------------------------------------------------------------

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select public.delete_account() $$, '42501', null, 'anon cannot call delete_account');

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select lives_ok($$ select public.delete_account() $$, 'a user can delete their own account');

reset role;

select is(
  (select count(*)::int from auth.users where id = '11111111-1111-1111-1111-111111111111'),
  0, 'delete_account removes the caller from auth.users');

select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0, 'delete_account removes the caller''s profile');

select is(
  (select count(*)::int from public.trips where user_id = '11111111-1111-1111-1111-111111111111')
    + (select count(*)::int from public.visits where user_id = '11111111-1111-1111-1111-111111111111')
    + (select count(*)::int from public.trip_photos where user_id = '11111111-1111-1111-1111-111111111111'),
  0, 'delete_account removes the caller''s trips, places and photo rows');

select is(
  (select count(*)::int from auth.users u join public.profiles p on p.id = u.id
    where u.id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')),
  2, 'delete_account leaves other users and their profiles alone');

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0, 'a deleted user''s profile is gone for everyone');

select * from finish();
rollback;
