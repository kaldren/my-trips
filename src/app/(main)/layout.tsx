import Link from "next/link";
import { Suspense } from "react";

import { MainNav } from "@/components/layout/main-nav";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/require-user";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-6 border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            My Trips
          </Link>
          <MainNav />
        </div>
        <Suspense>
          <UserMenu />
        </Suspense>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

// Early redirect for signed-out visitors. Data access still checks identity.
async function UserMenu() {
  const user = await requireUser();

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{user.email}</span>
      <SignOutButton />
    </div>
  );
}
