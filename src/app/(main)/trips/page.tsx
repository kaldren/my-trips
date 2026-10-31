import { MapPinnedIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TripPreviewCard } from "@/features/trips/components/trip-preview-card";
import { getMyTrips } from "@/features/trips/queries";

export const metadata: Metadata = { title: "Trips" };

export default async function TripsPage() {
  const trips = await getMyTrips();

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Your journal"
        title="Trips"
        description="Every trip you take, with its dates and the places you visited."
        actions={trips.length > 0 ? <NewTripLink /> : null}
      />

      {trips.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <TripPreviewCard {...trip} href={`/trips/${trip.id}`} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<MapPinnedIcon />}
          title="No trips yet"
          description="Add the places you went, a few photos and a short note."
          action={<NewTripLink label="Create your first trip" />}
        />
      )}
    </div>
  );
}

function NewTripLink({ label = "New trip" }: { label?: string }) {
  return (
    <Link href="/trips/new" className={buttonVariants({ size: "lg" })}>
      <PlusIcon aria-hidden data-icon="inline-start" />
      {label}
    </Link>
  );
}
