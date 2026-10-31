import { describe, expect, it } from "vitest";

import { deleteAccountSchema, profileSchema } from "./schemas";

const blank = { displayName: "", bio: "", age: "", location: "" };

describe("profileSchema", () => {
  it("turns blank fields into null", () => {
    expect(profileSchema.parse(blank)).toEqual({
      displayName: null,
      bio: null,
      age: null,
      location: null,
    });
  });

  it("trims text and parses numbers", () => {
    expect(
      profileSchema.parse({
        displayName: "  Ana Silva ",
        bio: "  Slow traveller.  ",
        age: " 34 ",
        location: " Sofia, Bulgaria ",
      }),
    ).toEqual({
      displayName: "Ana Silva",
      bio: "Slow traveller.",
      age: 34,
      location: "Sofia, Bulgaria",
    });
  });

  it.each(["12", "121", "30.5", "abc", "-1"])("rejects age %s", (age) => {
    const result = profileSchema.safeParse({ ...blank, age });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["age"]);
  });

  it("ignores a countries-visited value, which is counted from trips", () => {
    expect(profileSchema.parse({ ...blank, countriesVisited: "99" })).not.toHaveProperty(
      "countriesVisited",
    );
  });

  it("limits the name, bio and location length", () => {
    expect(profileSchema.safeParse({ ...blank, displayName: "x".repeat(61) }).success).toBe(false);
    expect(profileSchema.safeParse({ ...blank, bio: "x".repeat(280) }).success).toBe(true);
    expect(profileSchema.safeParse({ ...blank, bio: "x".repeat(281) }).success).toBe(false);
    expect(profileSchema.safeParse({ ...blank, location: "x".repeat(101) }).success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("accepts the confirmation word in any case", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: " Delete " }).success).toBe(true);
  });

  it("rejects anything else", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "yes" }).success).toBe(false);
  });
});
