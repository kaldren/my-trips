"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { isTripPhotoPath, tripPhotoFolder } from "./photo-paths";
import {
  createTripSchema,
  tripPhotosInputSchema,
  type CreateTripFieldErrors,
} from "./schemas";

export type CreateTripResult =
  | { ok: true; tripId: string; photoFolder: string }
  | { ok: false; error: string; fieldErrors?: CreateTripFieldErrors };

/**
 * Creates the trip row. Places and photos are attached afterwards, so the
 * result includes the storage folder the browser uploads photos into.
 */
export async function createTrip(input: unknown): Promise<CreateTripResult> {
  const user = await requireUser();

  const parsed = createTripSchema.safeParse(input);
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
