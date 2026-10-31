import { describe, expect, it } from "vitest";

import { boundsForPoints, routeLine, type MapPoint } from "./utils";

const lisbon: MapPoint = { id: "1", lng: -9.14, lat: 38.72, label: "Lisbon" };
const sintra: MapPoint = { id: "2", lng: -9.39, lat: 38.8, label: "Sintra" };
const porto: MapPoint = { id: "3", lng: -8.61, lat: 41.15, label: "Porto" };

describe("boundsForPoints", () => {
  it("returns null without points", () => {
    expect(boundsForPoints([])).toBeNull();
  });

  it("returns a zero-size box for one point", () => {
    expect(boundsForPoints([lisbon])).toEqual([
      [-9.14, 38.72],
      [-9.14, 38.72],
    ]);
  });

  it("contains every point", () => {
    expect(boundsForPoints([lisbon, sintra, porto])).toEqual([
      [-9.39, 38.72],
      [-8.61, 41.15],
    ]);
  });
});

describe("routeLine", () => {
  it("needs at least two points", () => {
    expect(routeLine([])).toBeNull();
    expect(routeLine([lisbon])).toBeNull();
  });

  it("connects points in order as [lng, lat]", () => {
    expect(routeLine([lisbon, porto, sintra])?.geometry.coordinates).toEqual([
      [-9.14, 38.72],
      [-8.61, 41.15],
      [-9.39, 38.8],
    ]);
  });
});
