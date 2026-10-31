import { Skeleton } from "@/components/ui/skeleton";

export default function TripsLoading() {
  return (
    <div role="status" className="flex flex-col gap-10">
      <span className="sr-only">Loading trips…</span>
      <div className="grid gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-6 w-full max-w-md" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
