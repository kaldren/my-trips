"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  applyTheme,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemePreference,
} from "./theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// The server can't know the theme; render as unknown and fill it in on hydrate.
function getServerSnapshot(): Theme | null {
  return null;
}

/** The active theme (null until hydrated) and a setter that persists the choice. */
export function useTheme() {
  const theme = useSyncExternalStore<Theme | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setTheme = useCallback((preference: ThemePreference) => {
    try {
      if (preference === "system") {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
      // Storage can be blocked; the choice still applies to this page.
      if (preference !== "system") {
        document.documentElement.classList.toggle("dark", preference === "dark");
        document.documentElement.style.colorScheme = preference;
        return;
      }
    }
    applyTheme(THEME_STORAGE_KEY);
  }, []);

  return { theme, setTheme };
}
