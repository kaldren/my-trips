/**
 * Light and dark themes. The `.dark` class on <html> switches the palette
 * tokens in globals.css (see DESIGN.md "Dark mode").
 *
 * The visitor's choice lives in localStorage. With no stored choice, the theme
 * follows the operating system. An inline script in the root layout applies
 * it before first paint, so pages never flash the wrong theme.
 */

export const THEME_STORAGE_KEY = "my-trips-theme";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

/**
 * Applies the stored preference to <html>. Self-contained (no imports or
 * module-scope references) because it is also serialized into the inline
 * <head> script by `themeScript`.
 */
export function applyTheme(storageKey: string): void {
  let preference: string | null = null;
  try {
    preference = window.localStorage.getItem(storageKey);
  } catch {
    // Storage can be blocked; fall back to the system theme.
  }
  const dark =
    preference === "dark" ||
    (preference !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Runs before first paint: applies the theme, then keeps it in sync with
 * system changes and with choices made in other tabs.
 */
export const themeScript = `(function(){var k=${JSON.stringify(THEME_STORAGE_KEY)};var a=${applyTheme.toString()};try{a(k);window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){a(k)});window.addEventListener("storage",function(e){if(e.key===k)a(k)})}catch(e){}})()`;
