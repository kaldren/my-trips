import { Luggage } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Trips" };

export default function TripsPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Your journal"
        title="Trips"
        description="Every trip you take, with its dates and the places you visited."
      />
      <EmptyState
        icon={<Luggage />}
        title="No trips yet"
        description="When you add a trip, it will appear here with its dates and places."
      />
    </div>
  );
}
