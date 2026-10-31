-- visits.country_code, replace_trip_visits storing it, and
-- count_visited_countries respecting trip visibility.
-- User A: a public trip in PT and ES (Lisbon and Porto both PT), a private
-- trip in BG and PT, and a place with no country. User B: no trips.
begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

insert into public.trips (id, user_id, title, start_date, end_date, visibility) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Iberia', '2026-03-03', '2026-03-06', 'public'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Private', '2026-04-01', '2026-04-02', 'private');

insert into public.visits (trip_id, user_id, name, label, lng, lat, country_code, position) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lisbon', 'Lisbon, Portugal', -9.14, 38.72, 'PT', 0),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Porto', 'Porto, Portugal', -8.61, 41.15, 'PT', 1),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Madrid', 'Madrid, Spain', -3.70, 40.42, 'ES', 2),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Old place', 'Somewhere', 0, 0, null, 3),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sofia', 'Sofia, Bulgaria', 23.32, 42.70, 'BG', 0),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Faro', 'Faro, Portugal', -7.93, 37.02, 'PT', 1);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

select throws_ok(
  $$ insert into public.visits (trip_id, user_id, name, label, lng, lat, country_code, position)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
             'Bad', 'Bad', 0, 0, 'pt', 9) $$,
  '23514', null, 'country codes must be two upper-case letters');

-- ---------------------------------------------------------------------------
-- Counting
-- ---------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select is(
  public.count_visited_countries('11111111-1111-1111-1111-111111111111'),
  3, 'owners count distinct countries across all their trips, private included');

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

select is(
  public.count_visited_countries('11111111-1111-1111-1111-111111111111'),
  2, 'other users count only countries on public trips');

select is(
  public.count_visited_countries('22222222-2222-2222-2222-222222222222'),
  0, 'a user with no trips has visited no countries');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select public.count_visited_countries('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'anon cannot count countries');

-- ---------------------------------------------------------------------------
-- replace_trip_visits stores country codes
-- ---------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select public.replace_trip_visits('aaaaaaaa-0000-0000-0000-000000000002',
       '[{"name":"Sofia","label":"Sofia, Bulgaria","lng":23.32,"lat":42.70,"countryCode":"bg"},
         {"name":"Rome","label":"Rome, Italy","lng":12.49,"lat":41.89,"countryCode":"IT"},
         {"name":"Old","label":"Old","lng":0,"lat":0}]'::jsonb) $$,
  'replace_trip_visits accepts places with and without a country');

select results_eq(
  $$ select name, country_code from public.visits
      where trip_id = 'aaaaaaaa-0000-0000-0000-000000000002' order by position $$,
  $$ values ('Sofia', 'BG'), ('Rome', 'IT'), ('Old', null) $$,
  'replace_trip_visits stores upper-case country codes');

select is(
  public.count_visited_countries('11111111-1111-1111-1111-111111111111'),
  4, 'the count follows the saved places');

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

select is(
  public.count_visited_countries('11111111-1111-1111-1111-111111111111'),
  2, 'countries on a private trip stay hidden from other users');

select * from finish();
rollback;
