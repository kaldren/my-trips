import type { Metadata } from "next";

import { NewTripComposer } from "./_components/new-trip-composer";

export const metadata: Metadata = { title: "New trip" };

export default function NewTripPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">New trip</h1>
        <p className="text-sm">
          Where you went, when, a few photos and a note. Watch the postcard fill
          in as you go.
        </p>
      </header>
      <NewTripComposer />
    </div>
  );
}
