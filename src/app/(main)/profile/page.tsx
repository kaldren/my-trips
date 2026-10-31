import { EyeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { DeleteAccountSection } from "@/features/profile/components/delete-account-section";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getMyProfile } from "@/features/profile/queries";
import { requireUser } from "@/lib/auth/require-user";

import { deleteAccount } from "./actions";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([requireUser(), getMyProfile()]);

  return (
    <div className="flex max-w-3xl flex-col gap-12">
      <PageHeader
        eyebrow="Profile"
        title="About you"
        description="Tell other travellers who you are. Everyone signed in to My Trips can see your profile."
        actions={
          <Link
            href={`/users/${user.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <EyeIcon aria-hidden data-icon="inline-start" />
            View profile
          </Link>
        }
      />
      <ProfileForm profile={profile} />
      <DeleteAccountSection email={user.email} deleteAccount={deleteAccount} />
    </div>
  );
}
