/** A place to draw on a map, in display order. */
export type MapPoint = {
  id: string;
  lng: number;
  lat: number;
  label: string;
};

/** [[west, south], [east, north]] */
export type PointBounds = [[number, number], [number, number]];

/** Smallest box containing every point, or null for no points. */
export function boundsForPoints(points: readonly MapPoint[]): PointBounds | null {
  if (points.length === 0) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const { lng, lat } of points) {
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}

export type RouteLineFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

/** A line through the points in order, or null when there are fewer than two. */
export function routeLine(points: readonly MapPoint[]): RouteLineFeature | null {
  if (points.length < 2) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points.map(({ lng, lat }) => [lng, lat]),
    },
  };
}
