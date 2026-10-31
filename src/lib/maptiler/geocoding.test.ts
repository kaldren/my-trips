import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_MAPTILER_KEY: "test-key" },
}));

const { toPlaces } = await import("./geocoding");

describe("toPlaces", () => {
  it("maps MapTiler features to places", () => {
    const places = toPlaces({
      type: "FeatureCollection",
      features: [
        {
          id: "municipality.123",
          text: "Lisbon",
          place_name: "Lisbon, Portugal",
          center: [-9.1393, 38.7223],
        },
      ],
    });

    expect(places).toEqual([
      {
        name: "Lisbon",
        label: "Lisbon, Portugal",
        lng: -9.1393,
        lat: 38.7223,
        providerId: "municipality.123",
      },
    ]);
  });

  it("falls back to the short name when place_name is missing", () => {
    const [place] = toPlaces({
      features: [{ id: "country.1", text: "Portugal", center: [-8, 39.5] }],
    });
    expect(place?.label).toBe("Portugal");
  });

  it("skips malformed features", () => {
    expect(
      toPlaces({
        features: [
          { id: "a", text: "No center" },
          { id: "b", text: "Bad center", center: ["x", 1] },
          { text: "No id", center: [1, 2] },
          null,
        ],
      }),
    ).toEqual([]);
  });

  it("returns nothing for an unexpected payload", () => {
    expect(toPlaces(null)).toEqual([]);
    expect(toPlaces({ message: "Invalid key" })).toEqual([]);
  });
});
