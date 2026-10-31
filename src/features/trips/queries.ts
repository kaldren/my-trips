import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { TRIP_PHOTOS_BUCKET, tripPhotoFolder } from "./photo-paths";
import type { TripVisibility } from "./schemas";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type TripSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  message: string | null;
  visibility: TripVisibility;
  placeNames: string[];
  coverUrl: string | null;
};

export type TripPhoto = { id: string; url: string; isCover: boolean };

export type TripDetail = Omit<TripSummary, "placeNames"> & {
  isOwner: boolean;
  /** When the owner archived the trip, or null. */
  archivedAt: string | null;
  photos: TripPhoto[];
};

export type EditableTripPhoto = TripPhoto & { path: string };

/** A trip as its owner edits it, with the storage paths of its photos. */
export type EditableTrip = Omit<TripDetail, "isOwner" | "coverUrl" | "photos"> & {
  /** Storage folder new photos are uploaded into. */
  photoFolder: string;
  photos: EditableTripPhoto[];
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Signs storage paths for display. Unsigned paths map to null. */
async function signPhotoUrls(
  supabase: Supabase,
  paths: string[],
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(TRIP_PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  return new Map(
    data.flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
}

/**
 * The signed-in user's own trips, newest first: active trips by default,
 * or only archived ones.
 */
export async function getMyTrips({
  archived = false,
}: { archived?: boolean } = {}): Promise<TripSummary[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const mine = supabase
    .from("trips")
    .select(
      "id, title, start_date, end_date, message, visibility, visits(name, position), trip_photos(storage_path, is_cover)",
    )
    // RLS also returns other users' public trips; this page lists only yours.
    .eq("user_id", user.id);
  const { data, error } = await (
    archived ? mine.not("archived_at", "is", null) : mine.is("archived_at", null)
  )
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const coverPaths = data.flatMap((trip) => {
    const cover = trip.trip_photos.find((photo) => photo.is_cover);
    return cover ? [cover.storage_path] : [];
  });
  const urls = await signPhotoUrls(supabase, coverPaths);

  return data.map((trip) => {
    const cover = trip.trip_photos.find((photo) => photo.is_cover);
    return {
      id: trip.id,
      title: trip.title,
      startDate: trip.start_date,
      endDate: trip.end_date,
      message: trip.message,
      visibility: trip.visibility,
      placeNames: [...trip.visits]
        .sort((a, b) => a.position - b.position)
        .map((visit) => visit.name),
      coverUrl: cover ? (urls.get(cover.storage_path) ?? null) : null,
    };
  });
}

/** How many trips the signed-in user has archived. */
export async function countMyArchivedTrips(): Promise<number> {
  const user = await requireUser();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("archived_at", "is", null);
  if (error) throw error;
  return count ?? 0;
}

/**
 * A trip the signed-in user can read: their own, or anyone's public trip.
 * Returns null when it does not exist or is not visible.
 */
export async function getTrip(tripId: string): Promise<TripDetail | null> {
  const user = await requireUser();
  if (!z.uuid().safeParse(tripId).success) return null;

  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, user_id, title, start_date, end_date, message, visibility, archived_at, trip_photos(id, storage_path, is_cover, position)",
    )
    .eq("id", tripId)
    .maybeSingle();
  if (error) throw error;
  if (!trip) return null;

  const photos = [...trip.trip_photos].sort((a, b) => a.position - b.position);
  const urls = await signPhotoUrls(
    supabase,
    photos.map((photo) => photo.storage_path),
  );
  const signed = photos.flatMap((photo) => {
    const url = urls.get(photo.storage_path);
    return url ? [{ id: photo.id, url, isCover: photo.is_cover }] : [];
  });

  return {
    id: trip.id,
    title: trip.title,
    startDate: trip.start_date,
    endDate: trip.end_date,
    message: trip.message,
    visibility: trip.visibility,
    isOwner: trip.user_id === user.id,
    archivedAt: trip.archived_at,
    coverUrl: signed.find((photo) => photo.isCover)?.url ?? null,
    photos: signed,
  };
}

/**
 * One of the signed-in user's own trips, ready to edit. Returns null when it
 * does not exist or belongs to someone else, even if it is public.
 */
export async function getTripForEdit(tripId: string): Promise<EditableTrip | null> {
  const user = await requireUser();
  if (!z.uuid().safeParse(tripId).success) return null;

  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, title, start_date, end_date, message, visibility, archived_at, trip_photos(id, storage_path, is_cover, position)",
    )
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!trip) return null;

  const photos = [...trip.trip_photos].sort((a, b) => a.position - b.position);
  const urls = await signPhotoUrls(
    supabase,
    photos.map((photo) => photo.storage_path),
  );

  return {
    id: trip.id,
    title: trip.title,
    startDate: trip.start_date,
    endDate: trip.end_date,
    message: trip.message,
    visibility: trip.visibility,
    archivedAt: trip.archived_at,
    photoFolder: tripPhotoFolder(user.id, trip.id),
    // Keep photos whose file is missing too, so saving does not drop them
    // silently; they show as broken thumbnails the owner can remove.
    photos: photos.map((photo) => ({
      id: photo.id,
      path: photo.storage_path,
      url: urls.get(photo.storage_path) ?? "",
      isCover: photo.is_cover,
    })),
  };
}
