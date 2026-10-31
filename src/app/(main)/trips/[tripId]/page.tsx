import {
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  MapPinnedIcon,
  UserRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBadge } from "@/components/ui/icon-badge";
import { profileName } from "@/features/profile/format";
import { getProfile } from "@/features/profile/queries";
import { TripsMapLazy } from "@/features/map/components/trips-map-lazy";
import type { MapPoint } from "@/features/map/utils";
import { formatPlaceCount, formatTripDates } from "@/features/trips/format";
import { TripGallery } from "@/features/trips/components/trip-gallery";
import { TripOwnerActions } from "@/features/trips/components/trip-owner-actions";
import { TripVisibilityBadge } from "@/features/trips/components/trip-visibility-badge";
import { getTrip } from "@/features/trips/queries";
import { getTripVisits } from "@/features/visits/queries";

export const metadata: Metadata = { title: "Trip" };

export default async function TripPage({
  params,
}: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;

  const trip = await getTrip(tripId);
  if (!trip) notFound();
  const [visits, owner] = await Promise.all([
    getTripVisits(trip.id),
    getProfile(trip.ownerId),
  ]);

  const points: MapPoint[] = visits.map((visit) => ({
    id: visit.id,
    lng: visit.lng,
    lat: visit.lat,
    label: visit.label,
  }));
  const archived = trip.isOwner && trip.archivedAt !== null;

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Link
            href={archived ? "/trips/archived" : "/trips"}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
          >
            <ArrowLeftIcon aria-hidden data-icon="inline-start" />
            {archived ? "Archived trips" : "All trips"}
          </Link>
          {trip.isOwner ? (
            <TripOwnerActions tripId={trip.id} title={trip.title} archived={archived} />
          ) : null}
        </div>

        {archived ? (
          <div className="flex items-start gap-4 rounded-3xl border-2 border-dashed border-foreground bg-muted p-5">
            <IconBadge tone="plain" className="-rotate-2">
              <ArchiveIcon aria-hidden />
            </IconBadge>
            <div className="flex flex-col gap-1">
              <p className="text-base font-extrabold">This trip is archived</p>
              <p className="text-base leading-relaxed">
                It&apos;s hidden from your trips list
                {trip.visibility === "public"
                  ? ", but anyone with the link can still see it"
                  : ""}
                . Unarchive it to bring it back.
              </p>
            </div>
          </div>
        ) : null}

        <header className="flex flex-col gap-4">
          <p className="text-sm font-extrabold tracking-widest uppercase">Trip</p>
          <h1 className="text-4xl font-black break-words sm:text-5xl">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base font-bold">
            <span className="inline-flex items-center gap-2">
              <CalendarDaysIcon aria-hidden className="size-5 stroke-[2.5]" />
              {formatTripDates(trip.startDate, trip.endDate)}
            </span>
            {visits.length > 0 ? (
              <span className="inline-flex items-center gap-2">
                <MapPinIcon aria-hidden className="size-5 stroke-[2.5]" />
                {formatPlaceCount(visits.length)}
              </span>
            ) : null}
            <TripVisibilityBadge visibility={trip.visibility} />
          </div>
          {owner ? (
            <Link
              href={`/users/${owner.id}`}
              className="inline-flex items-center gap-2 self-start rounded-xl text-base font-bold underline decoration-2 underline-offset-4 outline-none hover:decoration-[3px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <UserRoundIcon aria-hidden className="size-5 stroke-[2.5]" />
              {trip.isOwner ? "By you" : `By ${profileName(owner.displayName)}`}
            </Link>
          ) : null}
        </header>
      </div>

      {trip.coverUrl ? (
        <img
          src={trip.coverUrl}
          alt=""
          className="aspect-[2/1] w-full rounded-3xl border-2 border-foreground object-cover shadow-pop"
        />
      ) : null}

      {trip.message ? (
        <blockquote className="rounded-3xl border-2 border-foreground bg-muted px-6 py-5 text-xl leading-relaxed font-semibold break-words">
          <p>&ldquo;{trip.message}&rdquo;</p>
        </blockquote>
      ) : null}

      {visits.length > 0 ? (
        <section aria-labelledby="places-heading" className="flex flex-col gap-5">
          <h2 id="places-heading" className="text-2xl font-extrabold">
            Places
          </h2>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="h-72 overflow-hidden rounded-3xl border-2 border-foreground shadow-pop sm:h-96">
              <TripsMapLazy
                points={points}
                label={`Map of ${formatPlaceCount(visits.length)} on this trip`}
              />
            </div>
            <ol className="flex flex-col gap-3">
              {visits.map((visit, index) => (
                <li key={visit.id} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-accent text-sm font-black"
                  >
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base font-extrabold">{visit.name}</span>
                    <span className="text-sm">{visit.label}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<MapPinnedIcon />}
          title="No places yet"
          description="Places you visit on this trip will show up here."
        />
      )}

      {trip.photos.length > 0 ? (
        <section aria-labelledby="photos-heading" className="flex flex-col gap-5">
          <h2 id="photos-heading" className="text-2xl font-extrabold">
            Photos
          </h2>
          <TripGallery photos={trip.photos} />
        </section>
      ) : null}
    </article>
  );
}
