import { env } from "@/lib/env";

import { MAPTILER_API_URL } from "./config";

/** A geocoded place, independent of the provider's response shape. */
export type Place = {
  /** Short name, e.g. "Lisbon". */
  name: string;
  /** Full name with context, e.g. "Lisbon, Portugal". */
  label: string;
  lng: number;
  lat: number;
  /** The provider's feature id, kept for de-duplication and later lookups. */
  providerId: string;
};

type MapTilerFeature = {
  id?: unknown;
  text?: unknown;
  place_name?: unknown;
  center?: unknown;
};

function isCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

/** Maps a MapTiler geocoding response to places, skipping malformed features. */
export function toPlaces(response: unknown): Place[] {
  const features = (response as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];

  return features.flatMap((feature: MapTilerFeature) => {
    if (
      typeof feature?.id !== "string" ||
      typeof feature.text !== "string" ||
      !isCoordinatePair(feature.center)
    ) {
      return [];
    }
    const [lng, lat] = feature.center;
    const label =
      typeof feature.place_name === "string" && feature.place_name.length > 0
        ? feature.place_name
        : feature.text;

    return [{ name: feature.text, label, lng, lat, providerId: feature.id }];
  });
}

/** Forward geocoding for autocomplete. Pass an AbortSignal to cancel stale requests. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(
    `${MAPTILER_API_URL}/geocoding/${encodeURIComponent(q)}.json`,
  );
  url.searchParams.set("key", env.NEXT_PUBLIC_MAPTILER_KEY);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "6");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }
  return toPlaces(await response.json());
}
