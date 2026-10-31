import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div role="status" className="flex max-w-3xl flex-col gap-12">
      <span className="sr-only">Loading profile…</span>
      <div className="grid gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-6 w-full max-w-md" />
      </div>
      <Skeleton className="h-[30rem] rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  );
}
