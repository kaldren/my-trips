import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { isUsernameFormat } from "./schemas";

export type Profile = {
  id: string;
  /** The chosen handle, or null when the profile is addressed by its id. */
  username: string | null;
  displayName: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
};

const PROFILE_COLUMNS = "id, username, displayName:display_name, bio, age, location";

/**
 * Any user's profile, as signed-in users see it. Returns null when the user
 * does not exist, for example after deleting their account.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  await requireUser();
  if (!z.uuid().safeParse(userId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * A profile by the handle in its address: the user's id, or their username
 * in any case. Returns null when nobody has that id or username.
 */
export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  if (z.uuid().safeParse(handle).success) return getProfile(handle);

  await requireUser();
  if (!isUsernameFormat(handle)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username_key", handle.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Whether the signed-in user's account may use reserved usernames. */
export async function isMyAccountOfficial(): Promise<boolean> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_official")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.is_official ?? false;
}

/** The signed-in user's own profile, ready to edit. */
export async function getMyProfile(): Promise<Profile> {
  const user = await requireUser();
  // Every account gets a profile at sign-up; the fallback only covers a
  // missing row, which saving the form creates.
  return (
    (await getProfile(user.id)) ?? {
      id: user.id,
      username: null,
      displayName: null,
      bio: null,
      age: null,
      location: null,
    }
  );
}
