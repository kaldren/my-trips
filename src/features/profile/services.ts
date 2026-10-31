import "server-only";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the signed-in user's account. Their profile, trips,
 * places and photo rows cascade in the database. Storage files do not, so
 * remove them first. Signs the user out on this device afterwards.
 */
export async function deleteMyAccount(): Promise<{ ok: boolean }> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_account");
  if (error) return { ok: false };

  // The user no longer exists, so only clear this browser's session cookies.
  await supabase.auth.signOut({ scope: "local" });
  return { ok: true };
}
