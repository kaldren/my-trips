"use client";

import dynamic from "next/dynamic";

/** Client-only TripsMap: MapLibre needs the browser, so it never renders on the server. */
export const TripsMapLazy = dynamic(
  () => import("./trips-map").then((module) => module.TripsMap),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="size-full animate-pulse bg-muted" />
    ),
  },
);
