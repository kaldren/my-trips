import { CalendarDaysIcon, ImageIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { formatPlaceCount, formatTripDates } from "../format";
import type { TripVisibility } from "../schemas";

import { TripVisibilityBadge } from "./trip-visibility-badge";

export type TripPreviewCardProps = {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  placeNames: string[];
  message?: string | null;
  visibility: TripVisibility;
  coverUrl?: string | null;
  /** Makes the whole card a link. */
  href?: string;
  className?: string;
};

/**
 * Postcard-style summary of a trip: cover on top, details and message below.
 * Purely presentational, so it renders on the server or inside the composer.
 */
export function TripPreviewCard({
  title,
  startDate,
  endDate,
  placeNames,
  message,
  visibility,
  coverUrl,
  href,
  className,
}: TripPreviewCardProps) {
  const dates = formatTripDates(startDate, endDate);
  const trimmedTitle = title.trim();
  const trimmedMessage = message?.trim();

  const card = (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {coverUrl ? (
          // Signed, already-resized URLs; next/image optimization would
          // re-fetch per signature without a cache benefit.
          <img
            src={coverUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2">
            <ImageIcon aria-hidden className="size-8" strokeWidth={1.5} />
            <span className="text-sm">No cover photo yet</span>
          </div>
        )}
        <TripVisibilityBadge
          visibility={visibility}
          className="absolute top-3 left-3"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg leading-snug font-semibold text-balance break-words">
          {trimmedTitle || "Untitled trip"}
        </h3>

        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <dt>
              <CalendarDaysIcon aria-hidden className="size-4" />
              <span className="sr-only">Dates</span>
            </dt>
            <dd>{dates ?? "Dates not set"}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="pt-0.5">
              <MapPinIcon aria-hidden className="size-4" />
              <span className="sr-only">Places</span>
            </dt>
            <dd className="min-w-0">
              {placeNames.length > 0 ? (
                <>
                  <span className="font-medium">
                    {formatPlaceCount(placeNames.length)}
                  </span>
                  <span className="line-clamp-2"> {placeNames.join(" → ")}</span>
                </>
              ) : (
                "No places yet"
              )}
            </dd>
          </div>
        </dl>

        {trimmedMessage ? (
          <blockquote className="mt-auto border-t border-dashed pt-3 text-sm leading-relaxed italic break-words">
            <p className="line-clamp-4">&ldquo;{trimmedMessage}&rdquo;</p>
          </blockquote>
        ) : null}
      </div>
    </article>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block h-full rounded-xl transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
