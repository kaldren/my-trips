"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string };

// Public entry point: starts the Google OAuth flow. No session is required.
// Takes no user input, so there is nothing to validate.
export async function signInWithGoogle(): Promise<SignInState> {
  const origin = (await headers()).get("origin");
  if (!origin) {
    return { error: "Could not start Google sign-in." };
  }

  const supabase = await createClient();
  // Writes the PKCE code verifier cookie that /auth/callback needs.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { error: "Could not start Google sign-in." };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
