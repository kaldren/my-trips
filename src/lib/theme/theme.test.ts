import { afterEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY, themeScript } from "./theme";

describe("themeScript", () => {
  afterEach(() => vi.unstubAllGlobals());

  function run({ stored, systemDark }: { stored: string | null; systemDark: boolean }) {
    const classes = new Set<string>();
    const root = {
      classList: {
        toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
      },
      style: { colorScheme: "" },
    };
    const listeners: string[] = [];
    vi.stubGlobal("document", { documentElement: root });
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) },
      matchMedia: () => ({
        matches: systemDark,
        addEventListener: (type: string) => listeners.push(`media:${type}`),
      }),
      addEventListener: (type: string) => listeners.push(type),
    });
    new Function(themeScript)();
    return { dark: classes.has("dark"), colorScheme: root.style.colorScheme, listeners };
  }

  it("applies the stored choice and listens for changes", () => {
    expect(run({ stored: "dark", systemDark: false })).toEqual({
      dark: true,
      colorScheme: "dark",
      listeners: ["media:change", "storage"],
    });
  });

  it("uses an explicit choice over the system theme", () => {
    expect(run({ stored: "light", systemDark: true }).dark).toBe(false);
    expect(run({ stored: "dark", systemDark: false }).dark).toBe(true);
  });

  it("follows the system theme without a valid choice", () => {
    expect(run({ stored: null, systemDark: true }).dark).toBe(true);
    expect(run({ stored: null, systemDark: false }).dark).toBe(false);
    expect(run({ stored: "purple", systemDark: true }).dark).toBe(true);
  });
});
