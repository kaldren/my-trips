import { Skeleton } from "@/components/ui/skeleton";

export default function TripLoading() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <span className="sr-only">Loading trip…</span>
      <Skeleton className="h-10 w-32" />
      <div className="grid gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-72" />
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
