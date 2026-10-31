import { ArrowLeft, UserRoundX } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function UserProfileNotFound() {
  return (
    <EmptyState
      icon={<UserRoundX />}
      title="Profile not found"
      description="This traveller doesn't exist or has deleted their account."
      action={
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft data-icon="inline-start" />
          Back to dashboard
        </Link>
      }
    />
  );
}
