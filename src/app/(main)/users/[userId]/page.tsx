import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileView } from "@/features/profile/components/profile-view";
import { getProfile } from "@/features/profile/queries";
import { countVisitedCountries } from "@/features/visits/queries";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Profile" };

export default async function UserProfilePage({
  params,
}: PageProps<"/users/[userId]">) {
  const { userId } = await params;

  const [user, profile] = await Promise.all([requireUser(), getProfile(userId)]);
  if (!profile) notFound();
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
