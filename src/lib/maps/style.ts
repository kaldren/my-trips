import type { Theme } from "@/lib/theme/theme";

/**
 * Basemap styles for MapLibre, served by OpenFreeMap (no key needed), one per
 * app theme. Positron (light) and Dark are grayscale, so the green markers and
 * route stand out. Their attribution (OpenFreeMap, OpenMapTiles,
 * OpenStreetMap) comes from the style and is shown by MapLibre's attribution
 * control.
 */
export const mapStyleUrls: Record<Theme, string> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};
