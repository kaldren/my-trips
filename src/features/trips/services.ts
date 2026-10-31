import "server-only";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { TRIP_PHOTOS_BUCKET, tripPhotoFolder } from "./photo-paths";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Deletes every file in one of the user's trip folders. Listing the folder
 * also catches uploads that never made it into the gallery. Storage policies
 * check the trip row, so call this while the trip still exists.
 */
export async function removeTripPhotoFiles(
  supabase: Supabase,
  userId: string,
  tripId: string,
): Promise<{ ok: boolean }> {
  const folder = tripPhotoFolder(userId, tripId);
  const storage = supabase.storage.from(TRIP_PHOTOS_BUCKET);

  const { data: files, error: listError } = await storage.list(folder, {
    limit: 1000,
  });
  if (listError) return { ok: false };
  if (files.length === 0) return { ok: true };

  const { error } = await storage.remove(
    files.map((file) => `${folder}/${file.name}`),
  );
  return { ok: !error };
}

/**
 * Deletes the photo files of all the signed-in user's trips, archived ones
 * included. The rows stay; this runs before the account itself is deleted.
 */
export async function removeAllMyTripPhotoFiles(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("id")
    .eq("user_id", user.id);
  if (error) return { ok: false };

  for (const trip of trips) {
    const result = await removeTripPhotoFiles(supabase, user.id, trip.id);
    if (!result.ok) return result;
  }
  return { ok: true };
}
