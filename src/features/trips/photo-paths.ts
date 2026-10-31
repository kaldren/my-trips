/**
 * Storage layout for the trip-photos bucket: {userId}/{tripId}/{fileId}.{ext}.
 * Storage RLS checks the first two folders, so every path must be built here.
 */

export const TRIP_PHOTOS_BUCKET = "trip-photos";

export type TripPhotoExtension = "webp" | "jpg";

export function tripPhotoFolder(userId: string, tripId: string): string {
  return `${userId}/${tripId}`;
}

export function buildTripPhotoPath(
  folder: string,
  fileId: string,
  extension: TripPhotoExtension,
): string {
  return `${folder}/${fileId}.${extension}`;
}

const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/;

/** True when `path` is a single file directly inside this user's trip folder. */
export function isTripPhotoPath(
  path: string,
  userId: string,
  tripId: string,
): boolean {
  const prefix = `${tripPhotoFolder(userId, tripId)}/`;
  return path.startsWith(prefix) && FILE_NAME.test(path.slice(prefix.length));
}
