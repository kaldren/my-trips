"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { visitsInputSchema } from "./schemas";

export type AddVisitsResult = { ok: true } | { ok: false; error: string };

/**
 * Appends places to a trip in the given order. RLS rejects trips the caller
 * does not own.
 */
export async function addVisits(
  tripId: string,
  visits: unknown,
): Promise<AddVisitsResult> {
  const user = await requireUser();

  const parsedTripId = z.uuid().safeParse(tripId);
  const parsed = visitsInputSchema.safeParse(visits);
  if (!parsedTripId.success || !parsed.success) {
    return { ok: false, error: "Some places are invalid." };
  }
  if (parsed.data.length === 0) return { ok: true };

  const supabase = await createClient();

  // Continue numbering after any places already on the trip, so a retry
  // or a later addition never collides with existing positions.
  const { data: last, error: lastError } = await supabase
    .from("visits")
    .select("position")
    .eq("trip_id", parsedTripId.data)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) {
    return { ok: false, error: "Could not save places." };
  }
  const start = last ? last.position + 1 : 0;

  const { error } = await supabase.from("visits").insert(
    parsed.data.map((visit, index) => ({
      trip_id: parsedTripId.data,
      user_id: user.id,
      name: visit.name,
      label: visit.label,
      lng: visit.lng,
      lat: visit.lat,
      provider_id: visit.providerId ?? null,
      position: start + index,
    })),
  );
  if (error) {
    return { ok: false, error: "Could not save places." };
  }

  revalidatePath("/trips", "layout");
  return { ok: true };
}
