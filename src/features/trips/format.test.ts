import { describe, expect, it } from "vitest";

import { formatPlaceCount, formatTripDates } from "./format";

describe("formatTripDates", () => {
  it("collapses a range within one month", () => {
    expect(formatTripDates("2026-03-03", "2026-03-06")).toBe("Mar 3 – 6, 2026");
  });

  it("shows both months when the range crosses months", () => {
    expect(formatTripDates("2026-03-30", "2026-04-02")).toBe(
      "Mar 30 – Apr 2, 2026",
    );
  });

  it("shows a single date for one-day trips or a missing end", () => {
    expect(formatTripDates("2026-03-03", "2026-03-03")).toBe("Mar 3, 2026");
    expect(formatTripDates("2026-03-03", "")).toBe("Mar 3, 2026");
  });

  it("shows both years when the range crosses years", () => {
    expect(formatTripDates("2025-12-30", "2026-01-02")).toBe(
      "Dec 30, 2025 – Jan 2, 2026",
    );
  });

  it("ignores invalid dates", () => {
    expect(formatTripDates("2026-02-30", null)).toBeNull();
  });

  it("does not shift dates across time zones", () => {
    expect(formatTripDates("2026-01-01", null)).toBe("Jan 1, 2026");
  });

  it("returns null without dates", () => {
    expect(formatTripDates("", "")).toBeNull();
    expect(formatTripDates(undefined, undefined)).toBeNull();
  });
});

describe("formatPlaceCount", () => {
  it("pluralizes", () => {
    expect(formatPlaceCount(1)).toBe("1 place");
    expect(formatPlaceCount(3)).toBe("3 places");
  });
});
