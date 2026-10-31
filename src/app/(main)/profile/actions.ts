"use server";

import { redirect } from "next/navigation";

import type { DeleteAccountResult } from "@/features/profile/components/delete-account-section";
import { deleteAccountSchema } from "@/features/profile/schemas";
import { deleteMyAccount } from "@/features/profile/services";
import { removeAllMyTripPhotoFiles } from "@/features/trips/services";
import { requireUser } from "@/lib/auth/require-user";

const FAILED = "Could not delete your account. Please try again.";

/**
 * Deletes the signed-in user's account. Composes two features: trip photo
 * files go first (Storage checks the trip rows), then the account, which
 * cascades to everything else. Redirects to sign-in on success.
 */
export async function deleteAccount(input: unknown): Promise<DeleteAccountResult> {
  await requireUser();

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? FAILED };
  }

  const files = await removeAllMyTripPhotoFiles();
  if (!files.ok) return { ok: false, error: FAILED };

  const account = await deleteMyAccount();
  if (!account.ok) return { ok: false, error: FAILED };

  redirect("/login?deleted=1");
}
