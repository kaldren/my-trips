"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  LoaderCircleIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";

import { deleteTrip, setTripArchived } from "../actions";

/** Edit, archive or restore, and delete: shown to the trip's owner only. */
export function TripOwnerActions({
  tripId,
  title,
  archived,
}: {
  tripId: string;
  title: string;
  archived: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleArchived() {
    setError(null);
    startTransition(async () => {
      const result = await setTripArchived({ tripId, archived: !archived });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/trips/${tripId}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <PencilIcon aria-hidden data-icon="inline-start" />
          Edit
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleArchived}
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircleIcon aria-hidden data-icon="inline-start" className="animate-spin" />
          ) : archived ? (
            <ArchiveRestoreIcon aria-hidden data-icon="inline-start" />
          ) : (
            <ArchiveIcon aria-hidden data-icon="inline-start" />
          )}
          {archived ? "Unarchive" : "Archive"}
        </Button>
        <DeleteTripButton tripId={tripId} title={title} />
      </div>
      {error ? (
        <p role="alert" className="text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DeleteTripButton({ tripId, title }: { tripId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the trips list.
      const result = await deleteTrip(tripId);
      if (result?.ok === false) setError(result.error);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        setError(null);
      }}
    >
      <AlertDialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
        <Trash2Icon aria-hidden data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">
            Delete &ldquo;{title}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the trip with its places and photos. You
            can&apos;t undo it. To hide the trip from your list instead,
            archive it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-sm font-bold text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep trip</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircleIcon aria-hidden data-icon="inline-start" className="animate-spin" />
            ) : (
              <Trash2Icon aria-hidden data-icon="inline-start" />
            )}
            Delete trip
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
