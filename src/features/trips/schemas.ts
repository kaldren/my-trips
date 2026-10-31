import { z } from "zod";

export const TITLE_MAX = 80;
export const MESSAGE_MAX = 280;
export const MAX_PHOTOS = 10;

export const TRIP_VISIBILITIES = ["public", "private"] as const;
export type TripVisibility = (typeof TRIP_VISIBILITIES)[number];

/** File types accepted from the picker, before resizing. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Largest original file accepted from the picker, before resizing. */
export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;

const isoDate = z.iso.date({ error: "Pick a date." });

export const createTripSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give your trip a title.")
      .max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters.`),
    startDate: isoDate,
    endDate: isoDate,
    message: z
      .string()
      .trim()
      .max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX} characters.`)
      .optional(),
    visibility: z.enum(TRIP_VISIBILITIES).default("public"),
  })
  // ISO dates (YYYY-MM-DD) compare correctly as strings.
  .refine((trip) => trip.endDate >= trip.startDate, {
    path: ["endDate"],
    message: "The trip can't end before it starts.",
  });

export type CreateTripInput = z.input<typeof createTripSchema>;
export type CreateTripFieldErrors = Partial<
  Record<keyof CreateTripInput, string[]>
>;

export const tripPhotosInputSchema = z
  .array(
    z.object({
      path: z.string().min(1).max(300),
      isCover: z.boolean(),
    }),
  )
  .min(1)
  .max(MAX_PHOTOS, `Add up to ${MAX_PHOTOS} photos.`)
  .refine((photos) => photos.filter((photo) => photo.isCover).length === 1, {
    message: "Choose exactly one cover photo.",
  });

export type TripPhotoInput = z.infer<typeof tripPhotosInputSchema>[number];
