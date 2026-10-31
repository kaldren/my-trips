import { env } from "@/lib/env";

const AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

/** A geocoded place, independent of the provider's response shape. */
export type Place = {
  /** Short name, e.g. "Lisbon". */
  name: string;
  /** Full name with context, e.g. "Lisbon, Portugal". */
  label: string;
  lng: number;
  lat: number;
  /** The provider's place id, kept for de-duplication and later lookups. */
  providerId: string;
  /** ISO 3166-1 alpha-2 country code in upper case, e.g. "PT", when known. */
  countryCode: string | null;
};

/** A Geoapify result in `format=json`. Fields vary by result type. */
type GeoapifyResult = {
  place_id?: unknown;
  name?: unknown;
  address_line1?: unknown;
  formatted?: unknown;
  lon?: unknown;
  lat?: unknown;
  country_code?: unknown;
};

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

const COUNTRY_CODE = /^[a-z]{2}$/i;

function countryCode(value: unknown): string | null {
  return typeof value === "string" && COUNTRY_CODE.test(value) ? value.toUpperCase() : null;
}

function isCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Maps a Geoapify autocomplete response to places, skipping malformed results. */
export function toPlaces(response: unknown): Place[] {
  const results = (response as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];

  return results.flatMap((result: GeoapifyResult) => {
    const providerId = nonEmptyString(result?.place_id);
    const name = nonEmptyString(result?.name) ?? nonEmptyString(result?.address_line1);
    if (!providerId || !name || !isCoordinate(result.lon) || !isCoordinate(result.lat)) {
      return [];
    }
    const label = nonEmptyString(result.formatted) ?? name;

    return [
      {
        name,
        label,
        lng: result.lon,
        lat: result.lat,
        providerId,
        countryCode: countryCode(result.country_code),
      },
    ];
  });
}

/** Forward geocoding for autocomplete. Pass an AbortSignal to cancel stale requests. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(AUTOCOMPLETE_URL);
  url.searchParams.set("text", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("apiKey", env.NEXT_PUBLIC_GEOAPIFY_KEY);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }
  return toPlaces(await response.json());
}
