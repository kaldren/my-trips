import { z } from "zod";

export const MAX_VISITS = 20;

/** A place on a trip, as chosen from place search. Order is the array order. */
export const visitInputSchema = z.object({
  name: z.string().trim().min(1, "Place name is required.").max(120),
  label: z.string().trim().min(1).max(300),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  providerId: z.string().max(200).optional(),
});

export const visitsInputSchema = z
  .array(visitInputSchema)
  .max(MAX_VISITS, `Add up to ${MAX_VISITS} places.`);

export type VisitInput = z.infer<typeof visitInputSchema>;
