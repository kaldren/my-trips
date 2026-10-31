import { Map } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Explore"
        title="Map"
        description="All the places you've visited, pinned in one place."
      />
      <EmptyState
        icon={<Map />}
        title="Nothing pinned yet"
        description="Places you visit on your trips will appear here as pins."
        className="min-h-[50vh] justify-center"
      />
    </div>
  );
}
