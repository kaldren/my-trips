import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { env } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Request-scoped, user-authenticated client. Queries run as the signed-in
 * user and are subject to RLS. Create a new client per request.
 */
export async function createClient() {
  // Session checks depend on the current time (token expiry), so they must
  // never run during prerendering, including runtime prefetches.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The proxy refreshes the session, so this can be ignored.
          }
        },
      },
    },
  );
}
