import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

import { TripComposer } from "../_components/trip-composer";

export const metadata: Metadata = { title: "New trip" };

export default function NewTripPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Your journal"
        title="New trip"
        description="Where you went, when, a few photos and a note. Watch the postcard fill in as you go."
      />
      <TripComposer />
    </div>
  );
}
