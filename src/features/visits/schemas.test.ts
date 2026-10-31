import { describe, expect, it } from "vitest";

import { MAX_VISITS, visitInputSchema, visitsInputSchema } from "./schemas";

const lisbon = {
  name: "Lisbon",
  label: "Lisbon, Portugal",
  lng: -9.14,
  lat: 38.72,
  providerId: "municipality.1",
};

describe("visitInputSchema", () => {
  it("accepts a geocoded place", () => {
    expect(visitInputSchema.parse(lisbon)).toEqual(lisbon);
  });

  it("trims names and rejects blank ones", () => {
    expect(visitInputSchema.parse({ ...lisbon, name: "  Lisbon " }).name).toBe(
      "Lisbon",
    );
    expect(visitInputSchema.safeParse({ ...lisbon, name: "   " }).success).toBe(
      false,
    );
  });

  it.each([
    { lng: 180.1, lat: 0 },
    { lng: -180.1, lat: 0 },
    { lng: 0, lat: 90.1 },
    { lng: 0, lat: -90.1 },
  ])("rejects out-of-range coordinates %o", (coords) => {
    expect(visitInputSchema.safeParse({ ...lisbon, ...coords }).success).toBe(
      false,
    );
  });

  it("accepts the coordinate bounds", () => {
    expect(
      visitInputSchema.safeParse({ ...lisbon, lng: 180, lat: -90 }).success,
    ).toBe(true);
  });
});

describe("visitsInputSchema", () => {
  it("accepts an empty list", () => {
    expect(visitsInputSchema.parse([])).toEqual([]);
  });

  it(`accepts up to ${MAX_VISITS} places and rejects more`, () => {
    const many = Array.from({ length: MAX_VISITS }, () => lisbon);
    expect(visitsInputSchema.safeParse(many).success).toBe(true);
    expect(visitsInputSchema.safeParse([...many, lisbon]).success).toBe(false);
  });
});
