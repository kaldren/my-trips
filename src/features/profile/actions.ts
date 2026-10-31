"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { profileSchema, type ProfileFieldErrors } from "./schemas";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: ProfileFieldErrors };

/** Saves the signed-in user's profile, creating it on first save. */
export async function updateProfile(input: unknown): Promise<UpdateProfileResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: parsed.data.displayName,
    bio: parsed.data.bio,
    age: parsed.data.age,
    location: parsed.data.location,
  });
  if (error) {
    return { ok: false, error: "Could not save your profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath(`/users/${user.id}`);
  return { ok: true };
}
