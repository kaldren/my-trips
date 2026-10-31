-- Profile usernames: format, case-insensitive uniqueness, reserved handles,
-- official accounts, and releasing a handle on change.
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'u1@example.com'),
  ('55555555-5555-5555-5555-555555555555', 'u2@example.com'),
  ('66666666-6666-6666-6666-666666666666', 'official@example.com');

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

select is(
  (select username from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  null, 'new profiles start without a username');

-- ---------------------------------------------------------------------------
-- Format
-- ---------------------------------------------------------------------------

select pg_temp.act_as('44444444-4444-4444-4444-444444444444');

select lives_ok(
  $$ update public.profiles set username = 'John_Doe1' where id = '44444444-4444-4444-4444-444444444444' $$,
  'a valid username can be claimed');

select is(
  (select username from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  'John_Doe1', 'the username keeps the case it was typed in');

select throws_ok(
  $$ update public.profiles set username = 'ab' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'usernames are at least 3 characters');

select throws_ok(
  $$ update public.profiles set username = repeat('a', 21) where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'usernames are at most 20 characters');

select throws_ok(
  $$ update public.profiles set username = 'john.doe' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'usernames cannot contain periods');

select throws_ok(
  $$ update public.profiles set username = 'john-doe' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'usernames cannot contain dashes');

select throws_ok(
  $$ update public.profiles set username = 'jöhndoe' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'usernames cannot contain non-ASCII letters');

-- ---------------------------------------------------------------------------
-- Reserved handles
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ update public.profiles set username = 'SuperAdmin' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'usernames containing "admin" are reserved');

select throws_ok(
  $$ update public.profiles set username = 'support' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'platform names are reserved');

select throws_ok(
  $$ update public.profiles set is_official = true where id = '44444444-4444-4444-4444-444444444444' $$,
  '42501', null, 'users cannot make themselves official');

reset role;
update public.profiles set is_official = true where id = '66666666-6666-6666-6666-666666666666';
select pg_temp.act_as('66666666-6666-6666-6666-666666666666');

select lives_ok(
  $$ update public.profiles set username = 'MyTrips_Admin' where id = '66666666-6666-6666-6666-666666666666' $$,
  'official accounts can claim reserved handles');

-- ---------------------------------------------------------------------------
-- Uniqueness and releasing a handle
-- ---------------------------------------------------------------------------

select pg_temp.act_as('55555555-5555-5555-5555-555555555555');

select throws_ok(
  $$ update public.profiles set username = 'john_doe1' where id = '55555555-5555-5555-5555-555555555555' $$,
  '23505', null, 'a username taken in another case cannot be claimed');

select pg_temp.act_as('44444444-4444-4444-4444-444444444444');

select lives_ok(
  $$ update public.profiles set username = 'johnny' where id = '44444444-4444-4444-4444-444444444444' $$,
  'a user can change their username');

select pg_temp.act_as('55555555-5555-5555-5555-555555555555');

select lives_ok(
  $$ update public.profiles set username = 'JOHN_DOE1' where id = '55555555-5555-5555-5555-555555555555' $$,
  'the previous username is free to claim immediately');

select pg_temp.act_as('44444444-4444-4444-4444-444444444444');

select lives_ok(
  $$ update public.profiles set username = null where id = '44444444-4444-4444-4444-444444444444' $$,
  'a user can clear their username');

update public.profiles set username = 'stolen' where id = '55555555-5555-5555-5555-555555555555';
select is(
  (select username from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'JOHN_DOE1', 'users cannot change another user''s username');

select * from finish();
rollback;
