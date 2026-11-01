/**
 * Basemap style for MapLibre, served by OpenFreeMap (no key needed).
 * Positron is a light grayscale style; `tintBasemap` recolors its land and
 * water with the palette so the Tangerine markers and route stand out. Its
 * attribution (OpenFreeMap, OpenMapTiles, OpenStreetMap) comes from the style
 * and is shown by MapLibre's attribution control.
 */
export const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";

type PaintableMap = {
  getLayer(id: string): unknown;
  setPaintProperty(layer: string, name: string, value: string): unknown;
};

/** Paint Positron's land and water layers with the Land and Water tokens. */
export function tintBasemap(
  map: PaintableMap,
  colors: { land: string; water: string },
) {
  const paints: [layer: string, property: string, color: string][] = [
    ["background", "background-color", colors.land],
    ["road_area_pier", "fill-color", colors.land],
    ["road_pier", "line-color", colors.land],
    ["water", "fill-color", colors.water],
    ["waterway", "line-color", colors.water],
  ];
  for (const [layer, property, color] of paints) {
    if (map.getLayer(layer)) map.setPaintProperty(layer, property, color);
  }
}
