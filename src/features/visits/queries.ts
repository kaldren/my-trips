import "server-only";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type Visit = {
  id: string;
  name: string;
  label: string;
  lng: number;
  lat: number;
  providerId: string | null;
};

/** Places on a trip in visiting order. RLS limits results to readable trips. */
export async function getTripVisits(tripId: string): Promise<Visit[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visits")
    .select("id, name, label, lng, lat, providerId:provider_id")
    .eq("trip_id", tripId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
