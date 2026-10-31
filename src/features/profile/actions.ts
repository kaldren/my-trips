"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { isMyAccountOfficial } from "./queries";
import {
  isReservedUsername,
  profileSchema,
  USERNAME_RESERVED_MESSAGE,
  USERNAME_TAKEN_MESSAGE,
  type ProfileFieldErrors,
} from "./schemas";

export type UpdateProfileResult =
  | { ok: true; username: string | null }
  | { ok: false; error: string; fieldErrors?: ProfileFieldErrors };

const CHECK_FIELDS = "Check the highlighted fields.";

/** Saves the signed-in user's profile, creating it on first save. */
export async function updateProfile(input: unknown): Promise<UpdateProfileResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: CHECK_FIELDS,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { username } = parsed.data;

  if (username && isReservedUsername(username) && !(await isMyAccountOfficial())) {
    return {
      ok: false,
      error: CHECK_FIELDS,
      fieldErrors: { username: [USERNAME_RESERVED_MESSAGE] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username,
    display_name: parsed.data.displayName,
    bio: parsed.data.bio,
    age: parsed.data.age,
    location: parsed.data.location,
  });
  if (error?.code === "23505") {
    return {
      ok: false,
      error: CHECK_FIELDS,
      fieldErrors: { username: [USERNAME_TAKEN_MESSAGE] },
    };
  }
  if (error) {
    return { ok: false, error: "Could not save your profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/[handle]", "page");
  return { ok: true, username };
}
