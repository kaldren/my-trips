"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";

import { mapStyleUrl } from "@/lib/maptiler/config";
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

const FIT_OPTIONS = { padding: 56, maxZoom: 9 } as const;
const WORLD_VIEW = { longitude: 10, latitude: 25, zoom: 0.8 } as const;

/** MapLibre paint needs concrete colors, so read the palette tokens once. */
function readPalette() {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: style.getPropertyValue("--primary").trim(),
    halo: style.getPropertyValue("--background").trim(),
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
            {/* White casing keeps the green line visible on any basemap. */}
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
                "line-color": palette.primary,
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
            {/* Large bold numerals meet contrast on --primary (see DESIGN.md). */}
            <span
              title={point.label}
              className="flex size-9 items-center justify-center rounded-full border-2 border-foreground bg-primary text-[19px] leading-none font-bold text-primary-foreground shadow-md ring-3 ring-background"
            >
              {index + 1}
            </span>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
