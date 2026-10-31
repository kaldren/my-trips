import { describe, expect, it } from "vitest";

import { profileInitial, profileName, profilePath } from "./format";

describe("profileName", () => {
  it("uses the display name, or a fallback when it is blank", () => {
    expect(profileName("Ana Silva")).toBe("Ana Silva");
    expect(profileName(null)).toBe("Traveller");
    expect(profileName("   ")).toBe("Traveller");
  });
});

describe("profileInitial", () => {
  it("takes the first letter, upper-cased", () => {
    expect(profileInitial("ana")).toBe("A");
    expect(profileInitial(null)).toBe("T");
    expect(profileInitial("Élodie")).toBe("É");
  });
});


describe("profilePath", () => {
  const id = "11111111-1111-1111-1111-111111111111";

  it("uses the username when there is one, otherwise the id", () => {
    expect(profilePath({ id, username: "JohnDoe" })).toBe("/JohnDoe");
    expect(profilePath({ id, username: null })).toBe(`/${id}`);
  });
});
