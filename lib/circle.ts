import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type Partner = { id: string; display_name: string | null } | null;

// Renvoie une map id→display_name pour les membres du cercle (incluant
// l'user courant). Pratique pour résoudre reminder.assigned_to dans la
// liste sans requête supplémentaire.
export async function getMembersNameMap(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data: profile } = await supabase
    .from("profiles")
    .select("circle_id, display_name")
    .eq("id", userId)
    .maybeSingle();
  map.set(userId, profile?.display_name ?? "?");
  if (!profile?.circle_id) return map;

  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("circle_id", profile.circle_id);
  for (const m of members ?? []) {
    if (m.id) map.set(m.id, m.display_name ?? "?");
  }
  return map;
}

export async function getPartner(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Partner> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("circle_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.circle_id) return null;

  const { data: partner } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("circle_id", profile.circle_id)
    .neq("id", userId)
    .maybeSingle();
  return partner ?? null;
}
