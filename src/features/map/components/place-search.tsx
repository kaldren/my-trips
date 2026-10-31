"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { LoaderCircleIcon, MapPinIcon, SearchIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { searchPlaces, type Place } from "@/lib/maps/geocoding";

const DEBOUNCE_MS = 250;

/**
 * Type-ahead place search. Picking a result calls onSelect and clears the
 * field, ready for the next place.
 */
export function PlaceSearch({
  onSelect,
  label = "Where did you go?",
  disabled,
}: {
  onSelect: (place: Place) => void;
  label?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef<AbortController>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  function search(value: string) {
    clearTimeout(timer.current);
    request.current?.abort();

    if (value.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const places = await searchPlaces(value, controller.signal);
        if (controller.signal.aborted) return;
        setResults(places);
        setStatus("idle");
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);
  }

  const trimmed = query.trim();
  const message =
    status === "loading"
      ? "Searching…"
      : status === "error"
        ? "Place search is unavailable right now."
        : trimmed.length >= 2 && results.length === 0
          ? `No places match “${trimmed}”.`
          : null;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Combobox<Place>
        items={results}
        value={null}
        inputValue={query}
        filter={null}
        itemToStringLabel={(place) => place.label}
        isItemEqualToValue={(a, b) => a.providerId === b.providerId}
        onInputValueChange={(value, { reason }) => {
          setQuery(value);
          if (reason !== "item-press") search(value);
        }}
        onValueChange={(place) => {
          if (!place) return;
          onSelect(place);
          setQuery("");
          setResults([]);
          setStatus("idle");
        }}
        disabled={disabled}
      >
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2"
          />
          <ComboboxInput
            id={id}
            placeholder="Search a city, region or landmark"
            showTrigger={false}
            disabled={disabled}
            className="h-10 w-full [&_input]:pl-8"
          />
        </div>
        <ComboboxContent>
          <ComboboxPrimitive.Status>
            {message ? (
              <div className="flex items-center gap-2 px-2.5 py-2 text-sm">
                {status === "loading" ? (
                  <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
                ) : null}
                {message}
              </div>
            ) : null}
          </ComboboxPrimitive.Status>
          <ComboboxList>
            {(place: Place) => (
              <ComboboxItem key={place.providerId} value={place} className="py-2">
                <MapPinIcon aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{place.name}</span>
                  <span className="truncate text-xs">{place.label}</span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
          {/* Required by Geoapify's free plan. */}
          <p className="border-t-2 border-border px-2.5 py-2 text-sm">
            Search by{" "}
            <a
              href="https://www.geoapify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-bold underline decoration-2 underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Geoapify
            </a>
          </p>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
