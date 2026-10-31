-- Profiles and account deletion.
--
-- Every user has exactly one profile row: a trigger creates it at sign-up,
-- named after the Google account, and existing users are backfilled below.
-- Any signed-in user can read any profile; only the owner can change it.
-- Countries visited are not stored here: they are counted from the places on
-- the user's trips (see count_visited_countries).
--
-- delete_account() is SECURITY DEFINER because removing a row from
-- auth.users needs more than the caller's own rights. It takes no arguments
-- and only ever deletes the caller, so it cannot be aimed at another account.
-- Everything the user owns cascades from auth.users. Storage files cannot be
-- deleted from SQL, so the app removes them through the Storage API first.

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text
    check (display_name is null or char_length(display_name) between 1 and 60),
  bio text check (bio is null or char_length(bio) between 1 and 280),
  age smallint check (age is null or age between 13 and 120),
  location text check (location is null or char_length(location) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Signed-in users read every profile"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No delete policy: a profile goes away with its account. Signed-out
-- visitors get no access at all (Supabase grants anon by default).
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- One profile per user, named after the sign-in account.
-- ---------------------------------------------------------------------------

create function public.profile_name_from_metadata(metadata jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    nullif(btrim(coalesce(metadata ->> 'full_name', metadata ->> 'name')), ''),
    60
  );
$$;

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, public.profile_name_from_metadata(new.raw_user_meta_data))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

revoke execute on function public.create_profile_for_new_user()
  from public, anon, authenticated;

insert into public.profiles (id, display_name)
select id, public.profile_name_from_metadata(raw_user_meta_data)
  from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- delete_account: permanently deletes the signed-in user and all their data.
-- ---------------------------------------------------------------------------

create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = v_user_id;
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
