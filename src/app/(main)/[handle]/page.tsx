import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProfileView } from "@/features/profile/components/profile-view";
import { profileHandle, profilePath } from "@/features/profile/format";
import { getProfileByHandle } from "@/features/profile/queries";
import { countVisitedCountries } from "@/features/visits/queries";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Profile" };

/**
 * A profile at /handle, like x.com/handle. The handle is the user's id or
 * their username in any case; other handles for the same profile redirect to
 * its canonical address. Static routes such as /trips take precedence, which
 * is why their names are reserved usernames (see profile/schemas.ts).
 */
export default async function UserProfilePage({
  params,
}: PageProps<"/[handle]">) {
  const { handle } = await params;

  const [user, profile] = await Promise.all([
    requireUser(),
    getProfileByHandle(handle),
  ]);
  if (!profile) notFound();

  if (handle !== profileHandle(profile)) redirect(profilePath(profile));

  const countriesVisited = await countVisitedCountries(profile.id);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ProfileView
        profile={profile}
        countriesVisited={countriesVisited}
        isOwn={profile.id === user.id}
      />
    </div>
  );
}
