import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Renvoie la liste dédoublonnée et triée des catégories que l'user voit
// (RLS gère le filtre owner + cercle).
export async function listUserCategories(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data } = await supabase
    .from("reminders")
    .select("category")
    .not("category", "is", null);
  const set = new Set(
    (data ?? [])
      .map((r) => r.category)
      .filter((c): c is string => Boolean(c)),
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}
