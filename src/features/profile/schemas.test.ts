import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  deleteAccountSchema,
  isReservedUsername,
  isUsernameFormat,
  profileSchema,
} from "./schemas";

const blank = { username: "", displayName: "", bio: "", age: "", location: "" };

describe("profileSchema", () => {
  it("turns blank fields into null", () => {
    expect(profileSchema.parse(blank)).toEqual({
      username: null,
      displayName: null,
      bio: null,
      age: null,
      location: null,
    });
  });

  it("trims text and parses numbers", () => {
    expect(
      profileSchema.parse({
        username: " Ana_Silva ",
        displayName: "  Ana Silva ",
        bio: "  Slow traveller.  ",
        age: " 34 ",
        location: " Sofia, Bulgaria ",
      }),
    ).toEqual({
      username: "Ana_Silva",
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

describe("profileSchema username", () => {
  function parseUsername(username: string) {
    return profileSchema.safeParse({ ...blank, username });
  }

  it.each(["abc", "a".repeat(20), "John_Doe_99", "___", "123"])("accepts %s", (username) => {
    expect(parseUsername(username).data?.username).toBe(username);
  });

  it("drops a leading @ and keeps the case as typed", () => {
    expect(parseUsername(" @JohnDoe ").data?.username).toBe("JohnDoe");
    expect(parseUsername("@").data?.username).toBeNull();
  });

  it.each([
    ["too short", "ab"],
    ["too long", "a".repeat(21)],
    ["a space", "john doe"],
    ["a dash", "john-doe"],
    ["a period", "john.doe"],
    ["a symbol", "john$doe"],
    ["an emoji", "john😀"],
    ["a non-ASCII letter", "jöhndoe"],
  ])("rejects %s", (_, username) => {
    const result = parseUsername(username);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["username"]);
  });
});

describe("isReservedUsername", () => {
  it.each(["admin", "SuperAdmin", "ADMIN_bob", "moderator1", "MyTrips", "support", "Staff", "Settings", "trips"])(
    "reserves %s",
    (username) => {
      expect(isReservedUsername(username)).toBe(true);
    },
  );

  it.each(["JohnDoe", "adm_in", "supporter", "traveller"])("allows %s", (username) => {
    expect(isReservedUsername(username)).toBe(false);
  });
});

describe("reserved route names", () => {
  // Profiles live at /<username>, and a page at the same path would win.
  function topLevelSegments(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        if (/^\(.+\)$/.test(entry.name)) return topLevelSegments(join(dir, entry.name));
        if (/^[[@]/.test(entry.name) || entry.name.startsWith("_")) return [];
        return [entry.name];
      });
  }

  const segments = topLevelSegments(join(process.cwd(), "src/app"));

  it("finds the app's top-level routes", () => {
    expect(segments).toEqual(expect.arrayContaining(["dashboard", "map", "trips"]));
  });

  it.each(segments)("reserves /%s", (segment) => {
    expect(isUsernameFormat(segment) && !isReservedUsername(segment)).toBe(false);
  });
});

describe("isUsernameFormat", () => {
  it("tells usernames apart from ids and other strings", () => {
    expect(isUsernameFormat("John_Doe")).toBe(true);
    expect(isUsernameFormat("11111111-1111-1111-1111-111111111111")).toBe(false);
    expect(isUsernameFormat("ab")).toBe(false);
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
