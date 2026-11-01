import { CakeIcon, GlobeIcon, MapPinIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";

import { profileInitial, profileName } from "../format";
import type { Profile } from "../queries";

/**
 * A user's profile as others see it. `countriesVisited` is counted from
 * their trips by the page. Owners get an edit link and a note on what the
 * count includes.
 */
export function ProfileView({
  profile,
  countriesVisited,
  isOwn,
}: {
  profile: Profile;
  countriesVisited: number;
  isOwn: boolean;
}) {
  const name = profileName(profile.displayName);
  const hasDetails = profile.location !== null || profile.age !== null;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <span
            aria-hidden="true"
            className="inline-flex size-20 shrink-0 -rotate-2 items-center justify-center rounded-full border-2 border-foreground bg-accent text-4xl font-black text-accent-foreground shadow-pop sm:size-24 sm:text-5xl"
          >
            {profileInitial(profile.displayName)}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-extrabold tracking-widest uppercase">
              {isOwn ? "Your profile" : "Traveller"}
            </p>
            <h1 className="text-4xl font-black break-words sm:text-5xl">{name}</h1>
            {profile.username ? (
              <p className="text-lg font-bold">@{profile.username}</p>
            ) : null}
            {hasDetails ? (
              <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-base font-bold">
                {profile.location ? (
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <MapPinIcon aria-hidden className="size-5 shrink-0 stroke-[2.5]" />
                    <span className="break-words">{profile.location}</span>
                  </span>
                ) : null}
                {profile.age !== null ? (
                  <span className="inline-flex items-center gap-2">
                    <CakeIcon aria-hidden className="size-5 stroke-[2.5]" />
                    {profile.age} years old
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
        {isOwn ? (
          <Link
            href="/profile"
            className={buttonVariants({ variant: "outline", size: "sm", className: "self-start sm:self-center" })}
          >
            <PencilIcon aria-hidden data-icon="inline-start" />
            Edit profile
          </Link>
        ) : null}
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="gap-3">
          <CardTitle>About</CardTitle>
          <p className="text-lg leading-relaxed break-words whitespace-pre-line">
            {profile.bio ?? (isOwn ? "Add a few words about yourself." : `${name} hasn't written anything yet.`)}
          </p>
        </Card>

        <Card className="gap-4 bg-accent text-accent-foreground">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Countries visited</CardTitle>
            <IconBadge tone="plain" className="rotate-3">
              <GlobeIcon aria-hidden />
            </IconBadge>
          </div>
          <p className="text-6xl font-black tabular-nums">{countriesVisited}</p>
          <p className="text-sm font-bold">
            {isOwn
              ? "Counted from the places on all your trips. Others only see countries from your public trips."
              : "Counted from the places on their public trips."}
          </p>
        </Card>
      </div>
    </div>
  );
}
