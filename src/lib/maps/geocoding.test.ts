import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_GEOAPIFY_KEY: "test-key" },
}));

const { toPlaces } = await import("./geocoding");

describe("toPlaces", () => {
  it("maps Geoapify results to places", () => {
    const places = toPlaces({
      results: [
        {
          place_id: "51a4df1b4b1d4722c0596b3a1a0dd25c4340",
          name: "Lisbon",
          address_line1: "Lisbon",
          address_line2: "Portugal",
          formatted: "Lisbon, Portugal",
          result_type: "city",
          country_code: "pt",
          lon: -9.1393,
          lat: 38.7223,
        },
      ],
      query: { text: "Lisb" },
    });

    expect(places).toEqual([
      {
        name: "Lisbon",
        label: "Lisbon, Portugal",
        lng: -9.1393,
        lat: 38.7223,
        providerId: "51a4df1b4b1d4722c0596b3a1a0dd25c4340",
        countryCode: "PT",
      },
    ]);
  });

  it("falls back to address_line1 when name is missing", () => {
    const [place] = toPlaces({
      results: [
        {
          place_id: "p1",
          address_line1: "Rua Augusta 1",
          formatted: "Rua Augusta 1, Lisbon, Portugal",
          lon: -9.137,
          lat: 38.709,
        },
      ],
    });
    expect(place?.name).toBe("Rua Augusta 1");
    expect(place?.label).toBe("Rua Augusta 1, Lisbon, Portugal");
  });

  it("falls back to the short name when formatted is missing", () => {
    const [place] = toPlaces({
      results: [{ place_id: "p2", name: "Portugal", lon: -8, lat: 39.5 }],
    });
    expect(place?.label).toBe("Portugal");
  });

  it("skips malformed results", () => {
    expect(
      toPlaces({
        results: [
          { place_id: "a", name: "No coordinates" },
          { place_id: "b", name: "Bad lon", lon: "x", lat: 1 },
          { place_id: "c", name: "NaN lat", lon: 1, lat: Number.NaN },
          { name: "No id", lon: 1, lat: 2 },
          { place_id: "d", lon: 1, lat: 2 },
          null,
        ],
      }),
    ).toEqual([]);
  });

  it("returns nothing for an unexpected payload", () => {
    expect(toPlaces(null)).toEqual([]);
    expect(toPlaces({ statusCode: 401, message: "Invalid apiKey" })).toEqual([]);
  });
});
