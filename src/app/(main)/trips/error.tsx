"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function TripsError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-5 rounded-3xl border-2 border-destructive bg-destructive/5 px-6 py-14 text-center"
    >
      <span className="inline-flex size-16 items-center justify-center rounded-2xl border-2 border-destructive bg-background text-destructive">
        <TriangleAlert aria-hidden="true" className="size-8 stroke-[2.5]" />
      </span>
      <div className="grid gap-2">
        <h2 className="text-2xl font-extrabold">Something went wrong</h2>
        <p className="text-base">We couldn&apos;t load your trips. Give it another go.</p>
      </div>
      <Button variant="outline" onClick={() => retry()}>
        <RotateCcw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  );
}
