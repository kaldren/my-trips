import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use your Google account to continue to My Trips.
        </p>
      </div>
      <Suspense>
        <CallbackError searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </main>
  );
}

// /auth/callback redirects here with ?error=auth when the exchange fails
// (for example, the user cancelled on Google's consent screen).
async function CallbackError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p role="alert" className="text-sm text-destructive">
      Sign-in didn&apos;t complete. Please try again.
    </p>
  );
}
