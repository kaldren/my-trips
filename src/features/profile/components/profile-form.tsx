"use client";

import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateProfile } from "../actions";
import type { Profile } from "../queries";
import {
  AGE_MAX,
  AGE_MIN,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  LOCATION_MAX,
  USERNAME_MAX,
  USERNAME_MIN,
  type ProfileFieldErrors,
  type ProfileInput,
} from "../schemas";

type Status =
  | { kind: "idle" }
  | { kind: "saved" }
  | { kind: "error"; message: string; fieldErrors?: ProfileFieldErrors };

function toFormValues(profile: Profile): ProfileInput {
  return {
    username: profile.username ?? "",
    displayName: profile.displayName ?? "",
    bio: profile.bio ?? "",
    age: profile.age?.toString() ?? "",
    location: profile.location ?? "",
  };
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const id = useId();
  const [values, setValues] = useState(() => toFormValues(profile));
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const fieldErrors = status.kind === "error" ? status.fieldErrors : undefined;

  function change(field: keyof ProfileInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (status.kind === "saved") setStatus({ kind: "idle" });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateProfile(values);
      if (result.ok) {
        // Show the username as saved, for example without a typed "@".
        setValues((current) => ({ ...current, username: result.username ?? "" }));
        setStatus({ kind: "saved" });
      } else {
        setStatus({ kind: "error", message: result.error, fieldErrors: result.fieldErrors });
      }
    });
  }

  const ids = {
    username: `${id}-username`,
    displayName: `${id}-name`,
    bio: `${id}-bio`,
    age: `${id}-age`,
    location: `${id}-location`,
  };

  function describedBy(field: keyof ProfileInput, ...extra: string[]) {
    const all = [...extra, fieldErrors?.[field]?.length ? `${ids[field]}-error` : null];
    return all.filter(Boolean).join(" ") || undefined;
  }

  return (
    <Card className="gap-8 p-6 sm:p-8">
      <form onSubmit={save} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.username}>Username</Label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-extrabold"
            >
              @
            </span>
            <Input
              id={ids.username}
              name="username"
              value={values.username}
              onChange={(event) => change("username", event.target.value)}
              placeholder="ana_silva"
              maxLength={USERNAME_MAX + 1}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={isPending}
              aria-invalid={fieldErrors?.username?.length ? true : undefined}
              aria-describedby={describedBy("username", `${ids.username}-hint`)}
              className="pl-9"
            />
          </div>
          <p id={`${ids.username}-hint`} className="text-sm">
            {USERNAME_MIN}–{USERNAME_MAX} letters, numbers or underscores. Leave it blank to
            use your account ID in your profile link. If you change it, your old username
            becomes free for others to take.
          </p>
          <FieldError id={`${ids.username}-error`} messages={fieldErrors?.username} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.displayName}>Name</Label>
          <Input
            id={ids.displayName}
            name="displayName"
            value={values.displayName}
            onChange={(event) => change("displayName", event.target.value)}
            placeholder="Ana Silva"
            maxLength={DISPLAY_NAME_MAX}
            autoComplete="name"
            disabled={isPending}
            aria-invalid={fieldErrors?.displayName?.length ? true : undefined}
            aria-describedby={describedBy("displayName")}
          />
          <FieldError id={`${ids.displayName}-error`} messages={fieldErrors?.displayName} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor={ids.bio}>Who are you?</Label>
            <span id={`${ids.bio}-counter`} className="text-sm font-bold tabular-nums">
              {values.bio.length}/{BIO_MAX}
            </span>
          </div>
          <Textarea
            id={ids.bio}
            name="bio"
            value={values.bio}
            onChange={(event) => change("bio", event.target.value)}
            placeholder="Slow traveller, street-food hunter, always looking for the next mountain."
            maxLength={BIO_MAX}
            rows={3}
            disabled={isPending}
            aria-invalid={fieldErrors?.bio?.length ? true : undefined}
            aria-describedby={describedBy("bio", `${ids.bio}-counter`)}
            className="min-h-28 resize-none"
          />
          <FieldError id={`${ids.bio}-error`} messages={fieldErrors?.bio} />
        </div>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="flex flex-col gap-2">
            <Label htmlFor={ids.location}>Location</Label>
            <Input
              id={ids.location}
              name="location"
              value={values.location}
              onChange={(event) => change("location", event.target.value)}
              placeholder="Sofia, Bulgaria"
              maxLength={LOCATION_MAX}
              autoComplete="address-level2"
              disabled={isPending}
              aria-invalid={fieldErrors?.location?.length ? true : undefined}
              aria-describedby={describedBy("location")}
            />
            <FieldError id={`${ids.location}-error`} messages={fieldErrors?.location} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={ids.age}>Age</Label>
            <Input
              id={ids.age}
              name="age"
              type="number"
              inputMode="numeric"
              min={AGE_MIN}
              max={AGE_MAX}
              step={1}
              value={values.age}
              onChange={(event) => change("age", event.target.value)}
              disabled={isPending}
              aria-invalid={fieldErrors?.age?.length ? true : undefined}
              aria-describedby={describedBy("age")}
            />
            <FieldError id={`${ids.age}-error`} messages={fieldErrors?.age} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon aria-hidden data-icon="inline-start" className="animate-spin" />
            ) : null}
            Save profile
          </Button>
          <p role="status" className="text-sm font-bold">
            {status.kind === "saved" ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon aria-hidden className="size-4 stroke-[3]" />
                Profile saved.
              </span>
            ) : null}
          </p>
          {status.kind === "error" ? (
            <p role="alert" className="text-sm font-bold text-destructive">
              {status.message}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="text-sm font-bold text-destructive">
      {messages[0]}
    </p>
  );
}
