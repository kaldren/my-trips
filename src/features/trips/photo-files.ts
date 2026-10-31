import {
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTOS,
  MAX_SOURCE_IMAGE_BYTES,
} from "./schemas";

/**
 * Splits picked files into those that can be added and human-readable
 * reasons for the rest (wrong type, too large, over the photo limit).
 */
export function selectPhotoFiles(
  files: readonly File[],
  currentCount: number,
): { accepted: File[]; problems: string[] } {
  const accepted: File[] = [];
  const problems: string[] = [];
  let unsupported = 0;
  let heic = 0;
  let tooLarge = 0;
  let overLimit = 0;

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) heic++;
      else unsupported++;
    } else if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      tooLarge++;
    } else if (currentCount + accepted.length >= MAX_PHOTOS) {
      overLimit++;
    } else {
      accepted.push(file);
    }
  }

  if (heic) {
    problems.push(
      "HEIC photos aren't supported yet. Export them as JPEG first (on iPhone: Settings → Camera → Formats → Most Compatible).",
    );
  }
  if (unsupported) problems.push("Only JPEG, PNG and WebP images can be added.");
  if (tooLarge) {
    problems.push(
      `Photos must be under ${Math.round(MAX_SOURCE_IMAGE_BYTES / 1024 / 1024)} MB.`,
    );
  }
  if (overLimit) problems.push(`A trip can have up to ${MAX_PHOTOS} photos.`);

  return { accepted, problems };
}
