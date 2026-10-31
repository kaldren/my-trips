import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/layout/logo";
import { MainNav } from "@/components/layout/main-nav";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/require-user";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="rounded-xl">
              <Logo />
            </Link>
            <MainNav className="hidden md:block" />
          </div>
          <Suspense>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-10 pb-32 md:pb-16">
        {children}
      </main>
      <MainNav
        variant="tabs"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-foreground bg-background px-3 py-2 md:hidden"
      />
    </div>
  );
}

// Early redirect for signed-out visitors. Data access still checks identity.
async function UserMenu() {
  const user = await requireUser();
  const initial = user.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm font-bold lg:inline">{user.email}</span>
      <span
        aria-hidden="true"
        className="inline-flex size-10 items-center justify-center rounded-full border-2 border-foreground bg-accent text-lg font-black"
      >
        {initial}
      </span>
      <SignOutButton />
    </div>
  );
}
