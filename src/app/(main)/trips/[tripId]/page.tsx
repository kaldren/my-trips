import { ArrowLeft, MapPinned } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TripPage({
  params,
}: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/trips"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
      >
        <ArrowLeft data-icon="inline-start" />
        All trips
      </Link>
      <PageHeader eyebrow="Trip" title={`Trip ${tripId}`} />
      <EmptyState
        icon={<MapPinned />}
        title="No places yet"
        description="Places you visit on this trip will show up here."
      />
    </div>
  );
}
