import { describe, expect, it } from "vitest";

import {
  buildTripPhotoPath,
  isTripPhotoPath,
  tripPhotoFolder,
} from "./photo-paths";

const userId = "6f1c2a3b-0000-4000-8000-000000000001";
const otherUserId = "6f1c2a3b-0000-4000-8000-000000000002";
const tripId = "7a2b3c4d-0000-4000-8000-000000000001";
const otherTripId = "7a2b3c4d-0000-4000-8000-000000000002";
const fileId = "0b1c2d3e-4f50-4a6b-8c7d-8e9fa0b1c2d3";

describe("trip photo paths", () => {
  it("builds paths inside the user's trip folder", () => {
    const path = buildTripPhotoPath(tripPhotoFolder(userId, tripId), fileId, "webp");
    expect(path).toBe(`${userId}/${tripId}/${fileId}.webp`);
    expect(isTripPhotoPath(path, userId, tripId)).toBe(true);
  });

  it("accepts jpg fallbacks", () => {
    expect(
      isTripPhotoPath(`${userId}/${tripId}/${fileId}.jpg`, userId, tripId),
    ).toBe(true);
  });

  it.each([
    ["another user's folder", `${otherUserId}/${tripId}/${fileId}.webp`],
    ["another trip's folder", `${userId}/${otherTripId}/${fileId}.webp`],
    ["a nested path", `${userId}/${tripId}/x/${fileId}.webp`],
    ["a traversal", `${userId}/${tripId}/../${otherTripId}/${fileId}.webp`],
    ["an unexpected extension", `${userId}/${tripId}/${fileId}.svg`],
    ["a non-uuid file name", `${userId}/${tripId}/photo.webp`],
    ["a bare folder", `${userId}/${tripId}/`],
  ])("rejects %s", (_, path) => {
    expect(isTripPhotoPath(path, userId, tripId)).toBe(false);
  });
});
