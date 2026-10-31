import type { TripPhotoExtension } from "./photo-paths";

/** Longest edge of an uploaded photo, in pixels. */
const MAX_EDGE = 2048;
const QUALITY = 0.85;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Downscales and re-encodes a photo in the browser before upload.
 *
 * Re-encoding through a canvas also drops all metadata, including EXIF GPS
 * coordinates, which matters because trips are public by default. Encodes
 * WebP where the browser supports it and falls back to JPEG.
 */
export async function prepareImageForUpload(
  file: File,
): Promise<{ blob: Blob; extension: TripPhotoExtension }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");
    // Flatten transparency so a JPEG fallback does not turn it black.
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const webp = await canvasToBlob(canvas, "image/webp");
    if (webp?.type === "image/webp") return { blob: webp, extension: "webp" };

    const jpeg = await canvasToBlob(canvas, "image/jpeg");
    if (jpeg) return { blob: jpeg, extension: "jpg" };
    throw new Error("Could not encode the image.");
  } finally {
    bitmap.close();
  }
}
