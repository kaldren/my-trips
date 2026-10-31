"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import {
  TRIP_PHOTOS_BUCKET,
  isTripPhotoPath,
  tripPhotoFolder,
} from "./photo-paths";
import {
  archiveTripSchema,
  editTripPhotosSchema,
  tripDetailsSchema,
  tripIdSchema,
  tripPhotosInputSchema,
  type TripDetailsFieldErrors,
} from "./schemas";
import { removeTripPhotoFiles } from "./services";

const TRIP_NOT_FOUND = "This trip no longer exists, or it isn't yours.";

/** Raised by the update_trip and replace_trip_visits functions. */
const PG_NO_DATA_FOUND = "P0002";

export type CreateTripResult =
  | { ok: true; tripId: string; photoFolder: string }
  | { ok: false; error: string; fieldErrors?: TripDetailsFieldErrors };

/**
 * Creates the trip row. Places and photos are attached afterwards, so the
 * result includes the storage folder the browser uploads photos into.
 */
export async function createTrip(input: unknown): Promise<CreateTripResult> {
  const user = await requireUser();

  const parsed = tripDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      message: parsed.data.message || null,
      visibility: parsed.data.visibility,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: "Could not save the trip. Please try again." };
  }

  revalidatePath("/trips", "layout");
  return {
    ok: true,
    tripId: data.id,
    photoFolder: tripPhotoFolder(user.id, data.id),
  };
}

export type AttachTripPhotosResult = { ok: true } | { ok: false; error: string };

/**
 * Records photos the browser has already uploaded to the trip's folder.
 * Paths must sit in the caller's folder for this trip; RLS additionally
 * rejects trips the caller does not own.
 */
export async function attachTripPhotos(
  tripId: string,
  photos: unknown,
): Promise<AttachTripPhotosResult> {
  const user = await requireUser();

  const parsedTripId = z.uuid().safeParse(tripId);
  const parsed = tripPhotosInputSchema.safeParse(photos);
  if (
    !parsedTripId.success ||
    !parsed.success ||
    !parsed.data.every((photo) =>
      isTripPhotoPath(photo.path, user.id, parsedTripId.data),
    )
  ) {
    return { ok: false, error: "Some photos are invalid." };
  }

  const supabase = await createClient();

  // Append after existing photos and keep an existing cover, so adding
  // photos later never conflicts with what is already there.
  const { data: existing, error: existingError } = await supabase
    .from("trip_photos")
    .select("position, is_cover")
    .eq("trip_id", parsedTripId.data);
  if (existingError) {
    return { ok: false, error: "Could not save photos." };
  }
  const start = existing.reduce((max, p) => Math.max(max, p.position + 1), 0);
  const hasCover = existing.some((p) => p.is_cover);

  const { error } = await supabase.from("trip_photos").insert(
    parsed.data.map((photo, index) => ({
      trip_id: parsedTripId.data,
      user_id: user.id,
      storage_path: photo.path,
      is_cover: photo.isCover && !hasCover,
      position: start + index,
    })),
  );
  if (error) {
    return { ok: false, error: "Could not save photos." };
  }

  revalidatePath("/trips", "layout");
  return { ok: true };
}

export type UpdateTripResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: TripDetailsFieldErrors };

/**
 * Saves a trip's details and its complete photo list in one transaction.
 * `photos` is the full list in display order: rows not in it are removed,
 * and new paths must already be uploaded to the caller's folder for this
 * trip. Places are saved separately by the visits feature.
 */
export async function updateTrip(
  tripId: string,
  details: unknown,
  photos: unknown,
): Promise<UpdateTripResult> {
  const user = await requireUser();

  const parsedTripId = tripIdSchema.safeParse(tripId);
  if (!parsedTripId.success) return { ok: false, error: TRIP_NOT_FOUND };

  const parsed = tripDetailsSchema.safeParse(details);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const parsedPhotos = editTripPhotosSchema.safeParse(photos);
  if (
    !parsedPhotos.success ||
    !parsedPhotos.data.every((photo) =>
      isTripPhotoPath(photo.path, user.id, parsedTripId.data),
    )
  ) {
    return { ok: false, error: "Some photos are invalid." };
  }

  const supabase = await createClient();
  const { data: removedPaths, error } = await supabase.rpc("update_trip", {
    p_trip_id: parsedTripId.data,
    p_title: parsed.data.title,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
    p_message: parsed.data.message ?? "",
    p_visibility: parsed.data.visibility,
    p_photos: parsedPhotos.data,
  });
  if (error) {
    return {
      ok: false,
      error:
        error.code === PG_NO_DATA_FOUND
          ? TRIP_NOT_FOUND
          : "Could not save your changes. Please try again.",
    };
  }

  // The rows are already gone, so a file left behind here is unreachable.
  // Deleting the trip later clears its whole folder.
  if (removedPaths.length > 0) {
    await supabase.storage.from(TRIP_PHOTOS_BUCKET).remove(removedPaths);
  }

  revalidatePath("/trips", "layout");
  return { ok: true };
}

export type TripMutationResult = { ok: true } | { ok: false; error: string };

/** Archives or restores a trip. Archived trips leave the main trips list. */
export async function setTripArchived(
  input: unknown,
): Promise<TripMutationResult> {
  const user = await requireUser();

  const parsed = archiveTripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: TRIP_NOT_FOUND };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({
      archived_at: parsed.data.archived ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.tripId)
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    return { ok: false, error: "Could not update the trip. Please try again." };
  }
  if (data.length === 0) return { ok: false, error: TRIP_NOT_FOUND };

  revalidatePath("/trips", "layout");
  return { ok: true };
}

/**
 * Permanently deletes a trip with its places, photos and photo files, then
 * returns to the trips list. Only returns when something went wrong.
 */
export async function deleteTrip(tripId: string): Promise<TripMutationResult> {
  const user = await requireUser();

  const parsedTripId = tripIdSchema.safeParse(tripId);
  if (!parsedTripId.success) return { ok: false, error: TRIP_NOT_FOUND };

  const supabase = await createClient();
  const failed = { ok: false, error: "Could not delete the trip. Please try again." } as const;

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("id", parsedTripId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (tripError) return failed;
  if (!trip) return { ok: false, error: TRIP_NOT_FOUND };

  // Storage policies check the trip row, so clear its folder first.
  const removed = await removeTripPhotoFiles(supabase, user.id, trip.id);
  if (!removed.ok) return failed;

  // Places and photo rows cascade.
  const { error: deleteError } = await supabase
    .from("trips")
    .delete()
    .eq("id", trip.id)
    .eq("user_id", user.id);
  if (deleteError) return failed;

  revalidatePath("/trips", "layout");
  redirect("/trips");
}
