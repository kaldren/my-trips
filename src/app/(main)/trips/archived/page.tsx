import { ArchiveIcon, ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TripPreviewCard } from "@/features/trips/components/trip-preview-card";
import { getMyTrips } from "@/features/trips/queries";

export const metadata: Metadata = { title: "Archived trips" };

export default async function ArchivedTripsPage() {
  const trips = await getMyTrips({ archived: true });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <Link
          href="/trips"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
        >
          <ArrowLeftIcon aria-hidden data-icon="inline-start" />
          All trips
        </Link>
        <PageHeader
          eyebrow="Your journal"
          title="Archived trips"
          description="Trips you've put away. Open one to unarchive or delete it."
        />
      </div>

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
          icon={<ArchiveIcon />}
          title="No archived trips"
          description="Archive a trip from its page to tidy up your list without deleting it."
          action={
            <Link href="/trips" className={buttonVariants({ variant: "outline" })}>
              Back to trips
            </Link>
          }
        />
      )}
    </div>
  );
}
