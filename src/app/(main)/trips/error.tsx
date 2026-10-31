"use client";

import { Button } from "@/components/ui/button";

export default function TripsError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm">Something went wrong loading your trips.</p>
      <Button variant="outline" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
