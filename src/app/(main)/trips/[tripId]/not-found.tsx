import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function TripNotFound() {
  return (
    <EmptyState
      icon={<Compass />}
      title="Trip not found"
      description="This trip doesn't exist or isn't yours."
      action={
        <Link href="/trips" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft data-icon="inline-start" />
          Back to trips
        </Link>
      }
    />
  );
}
