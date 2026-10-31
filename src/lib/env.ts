import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Browser key by design (tiles and geocoding run client-side). Restrict it
  // to the app's origins in the MapTiler dashboard.
  NEXT_PUBLIC_MAPTILER_KEY: z.string().min(1),
});

// NEXT_PUBLIC_* values are inlined at build time, so each one must be
// referenced explicitly rather than read from a spread of process.env.
export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
});
