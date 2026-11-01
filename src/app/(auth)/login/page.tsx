import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RouteIllustration } from "@/components/illustrations/route-illustration";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; deleted?: string | string[] }>;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel: Lemon surface with Ink text. */}
      <aside className="relative hidden flex-col justify-center gap-12 overflow-hidden border-r-2 border-foreground bg-primary bg-dots p-12 lg:flex">
        <p className="max-w-md text-4xl leading-tight font-black">
          Pick up right where your last trip left off.
        </p>
        <div className="-rotate-2 rounded-[2.5rem] border-2 border-foreground bg-background p-8 shadow-pop-lg">
          <RouteIllustration />
        </div>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="self-start rounded-xl">
            <Logo />
          </Link>
          <div className="grid gap-3">
            <h1 className="text-4xl font-black">Sign in</h1>
            <p className="text-lg leading-relaxed">
              Use your Google account to continue to My Trips.
            </p>
          </div>
          <Suspense>
            <LoginNotice searchParams={searchParams} />
          </Suspense>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}

// /auth/callback redirects here with ?error=auth when the exchange fails
// (for example, the user cancelled on Google's consent screen). Deleting an
// account redirects here with ?deleted=1.
async function LoginNotice({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; deleted?: string | string[] }>;
}) {
  const { error, deleted } = await searchParams;
  if (!error && deleted) {
    return (
      <p
        role="status"
        className="rounded-2xl border-2 border-foreground bg-water px-4 py-3 text-sm font-bold"
      >
        Your account and all its data were deleted.
      </p>
    );
  }
  if (!error) return null;

  return (
    <p
      role="alert"
      className="rounded-2xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
    >
      Sign-in didn&apos;t complete. Please try again.
    </p>
  );
}
