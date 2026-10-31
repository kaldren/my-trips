import { describe, expect, it } from "vitest";

import {
  MAX_PHOTOS,
  MESSAGE_MAX,
  TITLE_MAX,
  createTripSchema,
  tripPhotosInputSchema,
} from "./schemas";

const valid = {
  title: "Lisbon long weekend",
  startDate: "2026-03-03",
  endDate: "2026-03-06",
};

describe("createTripSchema", () => {
  it("defaults visibility to public", () => {
    expect(createTripSchema.parse(valid).visibility).toBe("public");
  });

  it("accepts private visibility and rejects unknown values", () => {
    expect(
      createTripSchema.parse({ ...valid, visibility: "private" }).visibility,
    ).toBe("private");
    expect(
      createTripSchema.safeParse({ ...valid, visibility: "friends" }).success,
    ).toBe(false);
  });

  it("trims the title and rejects a blank one", () => {
    expect(createTripSchema.parse({ ...valid, title: "  Lisbon  " }).title).toBe(
      "Lisbon",
    );
    const result = createTripSchema.safeParse({ ...valid, title: "   " });
    expect(result.success).toBe(false);
  });

  it(`limits the title to ${TITLE_MAX} characters`, () => {
    expect(
      createTripSchema.safeParse({ ...valid, title: "a".repeat(TITLE_MAX) })
        .success,
    ).toBe(true);
    expect(
      createTripSchema.safeParse({ ...valid, title: "a".repeat(TITLE_MAX + 1) })
        .success,
    ).toBe(false);
  });

  it("allows a single-day trip", () => {
    expect(
      createTripSchema.safeParse({ ...valid, endDate: valid.startDate }).success,
    ).toBe(true);
  });

  it("rejects an end date before the start date, on endDate", () => {
    const result = createTripSchema.safeParse({
      ...valid,
      endDate: "2026-03-02",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });

  it("requires valid ISO dates", () => {
    expect(createTripSchema.safeParse({ ...valid, startDate: "" }).success).toBe(
      false,
    );
    expect(
      createTripSchema.safeParse({ ...valid, startDate: "2026-02-30" }).success,
    ).toBe(false);
  });

  it(`limits the message to ${MESSAGE_MAX} characters after trimming`, () => {
    expect(
      createTripSchema.safeParse({
        ...valid,
        message: ` ${"a".repeat(MESSAGE_MAX)} `,
      }).success,
    ).toBe(true);
    expect(
      createTripSchema.safeParse({
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
