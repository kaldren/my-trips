"use client";

import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { useId, useState, useTransition } from "react";

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
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DELETE_CONFIRMATION } from "../schemas";

export type DeleteAccountResult = { ok: false; error: string } | undefined;

/**
 * Asks for typed confirmation, then calls `deleteAccount`, which redirects
 * away on success. The page supplies the action because deleting an account
 * also clears data owned by other features.
 */
export function DeleteAccountSection({
  email,
  deleteAccount,
}: {
  email: string | null;
  deleteAccount: (input: { confirmation: string }) => Promise<DeleteAccountResult>;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmed = confirmation.trim().toLowerCase() === DELETE_CONFIRMATION;

  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount({ confirmation });
      if (result?.ok === false) setError(result.error);
    });
  }

  return (
    <section aria-labelledby={`${id}-title`}>
      <Card className="gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="grid gap-1">
          <CardTitle id={`${id}-title`} className="text-2xl">
            Delete account
          </CardTitle>
          <CardDescription className="max-w-prose">
            Permanently delete your account with your profile, trips, places and
            photos.
          </CardDescription>
        </div>
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            if (isPending) return;
            setOpen(next);
            setConfirmation("");
            setError(null);
          }}
        >
          <AlertDialogTrigger
            render={<Button type="button" variant="destructive" className="shrink-0" />}
          >
            <Trash2Icon aria-hidden data-icon="inline-start" />
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={confirmDelete} className="contents">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes
                  {email ? (
                    <>
                      {" "}
                      <strong className="break-all">{email}</strong> with
                    </>
                  ) : null}{" "}
                  your profile and every trip, place and photo you&apos;ve
                  added. You can&apos;t undo it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-confirm`}>
                  Type &ldquo;{DELETE_CONFIRMATION}&rdquo; to confirm
                </Label>
                <Input
                  id={`${id}-confirm`}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={isPending}
                />
              </div>
              {error ? (
                <p role="alert" className="text-sm font-bold text-destructive">
                  {error}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel type="button" disabled={isPending}>
                  Keep account
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  variant="destructive"
                  disabled={!confirmed || isPending}
                >
                  {isPending ? (
                    <LoaderCircleIcon aria-hidden data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Trash2Icon aria-hidden data-icon="inline-start" />
                  )}
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </section>
  );
}
