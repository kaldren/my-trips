import { describe, expect, it } from "vitest";

import {
  MAX_PHOTOS,
  MESSAGE_MAX,
  TITLE_MAX,
  archiveTripSchema,
  editTripPhotosSchema,
  tripDetailsSchema,
  tripPhotosInputSchema,
} from "./schemas";

const valid = {
  title: "Lisbon long weekend",
  startDate: "2026-03-03",
  endDate: "2026-03-06",
};

describe("tripDetailsSchema", () => {
  it("defaults visibility to public", () => {
    expect(tripDetailsSchema.parse(valid).visibility).toBe("public");
  });

  it("accepts private visibility and rejects unknown values", () => {
    expect(
      tripDetailsSchema.parse({ ...valid, visibility: "private" }).visibility,
    ).toBe("private");
    expect(
      tripDetailsSchema.safeParse({ ...valid, visibility: "friends" }).success,
    ).toBe(false);
  });

  it("trims the title and rejects a blank one", () => {
    expect(tripDetailsSchema.parse({ ...valid, title: "  Lisbon  " }).title).toBe(
      "Lisbon",
    );
    const result = tripDetailsSchema.safeParse({ ...valid, title: "   " });
    expect(result.success).toBe(false);
  });

  it(`limits the title to ${TITLE_MAX} characters`, () => {
    expect(
      tripDetailsSchema.safeParse({ ...valid, title: "a".repeat(TITLE_MAX) })
        .success,
    ).toBe(true);
    expect(
      tripDetailsSchema.safeParse({ ...valid, title: "a".repeat(TITLE_MAX + 1) })
        .success,
    ).toBe(false);
  });

  it("allows a single-day trip", () => {
    expect(
      tripDetailsSchema.safeParse({ ...valid, endDate: valid.startDate }).success,
    ).toBe(true);
  });

  it("rejects an end date before the start date, on endDate", () => {
    const result = tripDetailsSchema.safeParse({
      ...valid,
      endDate: "2026-03-02",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });

  it("requires valid ISO dates", () => {
    expect(tripDetailsSchema.safeParse({ ...valid, startDate: "" }).success).toBe(
      false,
    );
    expect(
      tripDetailsSchema.safeParse({ ...valid, startDate: "2026-02-30" }).success,
    ).toBe(false);
  });

  it(`limits the message to ${MESSAGE_MAX} characters after trimming`, () => {
    expect(
      tripDetailsSchema.safeParse({
        ...valid,
        message: ` ${"a".repeat(MESSAGE_MAX)} `,
      }).success,
    ).toBe(true);
    expect(
      tripDetailsSchema.safeParse({
        ...valid,
        message: "a".repeat(MESSAGE_MAX + 1),
      }).success,
    ).toBe(false);
  });
});

describe("tripPhotosInputSchema", () => {
  const photo = (isCover = false) => ({ path: "u/t/p.webp", isCover });

  it("requires exactly one cover", () => {
    expect(tripPhotosInputSchema.safeParse([photo(true), photo()]).success).toBe(
      true,
    );
    expect(tripPhotosInputSchema.safeParse([photo(), photo()]).success).toBe(
      false,
    );
    expect(
      tripPhotosInputSchema.safeParse([photo(true), photo(true)]).success,
    ).toBe(false);
  });

  it(`accepts 1 to ${MAX_PHOTOS} photos`, () => {
    expect(tripPhotosInputSchema.safeParse([]).success).toBe(false);
    const many = [photo(true), ...Array.from({ length: MAX_PHOTOS - 1 }, () => photo())];
    expect(tripPhotosInputSchema.safeParse(many).success).toBe(true);
    expect(tripPhotosInputSchema.safeParse([...many, photo()]).success).toBe(
      false,
    );
  });
});

describe("editTripPhotosSchema", () => {
  const photo = (path: string, isCover = false) => ({ path, isCover });

  it("allows removing every photo", () => {
    expect(editTripPhotosSchema.safeParse([]).success).toBe(true);
  });

  it("requires exactly one cover when there are photos", () => {
    expect(
      editTripPhotosSchema.safeParse([photo("a", true), photo("b")]).success,
    ).toBe(true);
    expect(editTripPhotosSchema.safeParse([photo("a"), photo("b")]).success).toBe(
      false,
    );
    expect(
      editTripPhotosSchema.safeParse([photo("a", true), photo("b", true)])
        .success,
    ).toBe(false);
  });

  it("rejects the same photo twice", () => {
    expect(
      editTripPhotosSchema.safeParse([photo("a", true), photo("a")]).success,
    ).toBe(false);
  });

  it(`allows up to ${MAX_PHOTOS} photos`, () => {
    const many = Array.from({ length: MAX_PHOTOS }, (_, i) => photo(`p${i}`, i === 0));
    expect(editTripPhotosSchema.safeParse(many).success).toBe(true);
    expect(editTripPhotosSchema.safeParse([...many, photo("extra")]).success).toBe(
      false,
    );
  });
});

describe("archiveTripSchema", () => {
  it("requires a trip id and an archived flag", () => {
    const tripId = "aaaaaaaa-0000-4000-8000-000000000001";
    expect(archiveTripSchema.safeParse({ tripId, archived: true }).success).toBe(
      true,
    );
    expect(
      archiveTripSchema.safeParse({ tripId: "nope", archived: true }).success,
    ).toBe(false);
    expect(archiveTripSchema.safeParse({ tripId }).success).toBe(false);
  });
});
