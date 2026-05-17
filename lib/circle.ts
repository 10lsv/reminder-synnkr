import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type Partner = { id: string; display_name: string | null } | null;

// Renvoie le profil du partenaire de l'user dans son cercle, ou null s'il
// n'est appairé à personne.
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
