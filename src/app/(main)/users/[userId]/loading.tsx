import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileLoading() {
  return (
    <div role="status" className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <span className="sr-only">Loading profile…</span>
      <div className="flex items-center gap-5">
        <Skeleton className="size-20 rounded-full sm:size-24" />
        <div className="grid flex-1 gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full max-w-xs" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </div>
  );
}
