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
  countryCode: string | null;
};

/** Places on a trip in visiting order. RLS limits results to readable trips. */
export async function getTripVisits(tripId: string): Promise<Visit[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visits")
    .select("id, name, label, lng, lat, providerId:provider_id, countryCode:country_code")
    .eq("trip_id", tripId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * How many distinct countries a user has visited, counted from the places
 * on their trips. RLS decides which trips count: the owner gets all of
 * them, everyone else only the user's public trips.
 */
export async function countVisitedCountries(userId: string): Promise<number> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("count_visited_countries", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}
