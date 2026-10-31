import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
};

const PROFILE_COLUMNS = "id, displayName:display_name, bio, age, location";

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

/** The signed-in user's own profile, ready to edit. */
export async function getMyProfile(): Promise<Profile> {
  const user = await requireUser();
  // Every account gets a profile at sign-up; the fallback only covers a
  // missing row, which saving the form creates.
  return (
    (await getProfile(user.id)) ?? {
      id: user.id,
      displayName: null,
      bio: null,
      age: null,
      location: null,
    }
  );
}
