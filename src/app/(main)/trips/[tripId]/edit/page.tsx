import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getTripForEdit } from "@/features/trips/queries";
import { getTripVisits } from "@/features/visits/queries";

import { TripComposer, type TripComposerTrip } from "../../_components/trip-composer";

export const metadata: Metadata = { title: "Edit trip" };

export default async function EditTripPage({
  params,
}: PageProps<"/trips/[tripId]/edit">) {
  const { tripId } = await params;

  // Owner only: someone else's public trip is not found here.
  const trip = await getTripForEdit(tripId);
  if (!trip) notFound();
  const visits = await getTripVisits(trip.id);

  const editable: TripComposerTrip = {
    id: trip.id,
    photoFolder: trip.photoFolder,
    title: trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    message: trip.message ?? "",
    visibility: trip.visibility,
    places: visits.map((visit) => ({
      name: visit.name,
      label: visit.label,
      lng: visit.lng,
      lat: visit.lat,
      // Older places may lack a provider id; the visit id keeps them unique.
      providerId: visit.providerId ?? `visit:${visit.id}`,
      countryCode: visit.countryCode,
    })),
    photos: trip.photos,
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <Link
          href={`/trips/${trip.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
        >
          <ArrowLeftIcon aria-hidden data-icon="inline-start" />
          Back to trip
        </Link>
        <PageHeader
          eyebrow="Edit trip"
          title={<span className="break-words">{trip.title}</span>}
          description="Change the details, places and photos. Nothing changes until you save."
        />
      </div>
      <TripComposer trip={editable} />
    </div>
  );
}
