"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { setWorkerUrl } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";

import { mapStyleUrl, tintBasemap } from "@/lib/maps/style";
import { cn } from "@/lib/utils";

import { boundsForPoints, routeLine, type MapPoint } from "../utils";

export type TripsMapProps = {
  points: MapPoint[];
  /** Connect the points in order with a line. */
  showRoute?: boolean;
  /** Accessible name for the map region. */
  label: string;
  className?: string;
};

// MapLibre looks for its worker next to its own module file, which no longer
// exists once the bundler moves MapLibre into a chunk. Point it at the worker
// file the bundler emits instead, or no tiles load and only markers show.
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
);

const FIT_OPTIONS = { padding: 56, maxZoom: 9 } as const;
const WORLD_VIEW = { longitude: 10, latitude: 25, zoom: 0.8 } as const;

/** MapLibre paint needs concrete colors, so read the palette tokens once. */
function readPalette() {
  const style = getComputedStyle(document.documentElement);
  return {
    pin: style.getPropertyValue("--accent").trim(),
    halo: style.getPropertyValue("--background").trim(),
    land: style.getPropertyValue("--land").trim(),
    water: style.getPropertyValue("--water").trim(),
  };
}

/**
 * Numbered markers and an optional route line, fitted to the points.
 * Browser-only (MapLibre needs WebGL); load it through TripsMapLazy.
 */
export function TripsMap({
  points,
  showRoute = true,
  label,
  className,
}: TripsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [palette] = useState(readPalette);
  const bounds = useMemo(() => boundsForPoints(points), [points]);
  const route = useMemo(
    () => (showRoute ? routeLine(points) : null),
    [points, showRoute],
  );

  // Refit when the points change after the first render.
  useEffect(() => {
    if (bounds) mapRef.current?.fitBounds(bounds, { ...FIT_OPTIONS, duration: 700 });
  }, [bounds]);

  return (
    <div
      role="region"
      aria-label={label}
      className={cn("relative size-full overflow-hidden", className)}
    >
      <Map
        ref={mapRef}
        mapStyle={mapStyleUrl}
        onLoad={(event) => tintBasemap(event.target, palette)}
        initialViewState={
          bounds ? { bounds, fitBoundsOptions: FIT_OPTIONS } : WORLD_VIEW
        }
        scrollZoom={false}
        dragRotate={false}
        touchPitch={false}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {route ? (
          <Source id="trip-route" type="geojson" data={route}>
            {/* Cream casing keeps the Tangerine line visible on any basemap. */}
            <Layer
              id="trip-route-casing"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{ "line-color": palette.halo, "line-width": 7 }}
            />
            <Layer
              id="trip-route-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": palette.pin,
                "line-width": 3.5,
                "line-dasharray": [2, 1.5],
              }}
            />
          </Source>
        ) : null}

        {points.map((point, index) => (
          <Marker
            key={point.id}
            longitude={point.lng}
            latitude={point.lat}
            anchor="center"
          >
            {/* Ink numerals on Tangerine, with a Cream halo (see DESIGN.md). */}
            <span
              title={point.label}
              className="flex size-9 items-center justify-center rounded-full border-2 border-foreground bg-accent text-[19px] leading-none font-bold text-accent-foreground shadow-md ring-3 ring-background"
            >
              {index + 1}
            </span>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
