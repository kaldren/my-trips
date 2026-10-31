-- Usernames (handles) for profiles.
--
-- A profile starts without a username: its address is the user's id
-- (/<uuid>). With a username it is /<username>, like x.com/<handle>. The owner can claim a username later and change or clear
-- it at any time; the old one is free for anyone to claim straight away.
--
-- Rules, mirrored in src/features/profile/schemas.ts (keep them in sync):
--   * 3 to 20 characters: ASCII letters, digits and underscores only.
--   * Unique regardless of case: "JohnDoe" and "johndoe" are the same handle.
--     The username is stored as typed; username_key is its lower-case form,
--     which is unique and used for lookups.
--   * Reserved handles (see is_reserved_username) pose as the platform or its
--     staff, such as anything containing "admin", or are platform words such
--     as page names. Profiles share the top-level URL space with pages, so
--     every top-level route must be reserved. They are only allowed on
--     official accounts. is_official is set by the team through SQL or
--     Studio; users cannot write it.

alter table public.profiles
  add column username text,
  add column is_official boolean not null default false;

create function public.is_reserved_username(username text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(username) ~ '(admin|moderator|mytrips|my_trips)'
      or lower(username) = any (array[
           '_next', '_vercel', 'about', 'account', 'anonymous', 'api', 'auth',
           'callback', 'dashboard', 'everyone', 'explore', 'help', 'home',
           'login', 'logout', 'map', 'new', 'null', 'official', 'privacy',
           'profile', 'root', 'search', 'security', 'settings', 'signin',
           'signup', 'staff', 'support', 'system', 'terms', 'trips',
           'undefined', 'users'
         ]);
$$;

alter table public.profiles
  add constraint profiles_username_format
    check (username is null or username ~ '^[A-Za-z0-9_]{3,20}$'),
  add constraint profiles_username_not_reserved
    check (username is null or is_official or not public.is_reserved_username(username));

alter table public.profiles
  add column username_key text generated always as (lower(username)) stored
    constraint profiles_username_key unique;

-- Users may write their own profile fields, but not is_official.
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, bio, age, location, username),
      update (id, display_name, bio, age, location, username)
  on public.profiles to authenticated;
