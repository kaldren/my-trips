import { env } from "@/lib/env";

export const MAPTILER_API_URL = "https://api.maptiler.com";

/** Vector style for MapLibre. */
export const mapStyleUrl = `${MAPTILER_API_URL}/maps/streets-v2/style.json?key=${env.NEXT_PUBLIC_MAPTILER_KEY}`;
