import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type Model = Tables<"models">;

export const MODEL_STATUSES = ["active", "paused", "dropped"] as const;
export type ModelStatus = (typeof MODEL_STATUSES)[number];

// Palette restreinte : 6 couleurs, mappées en classes Tailwind cohérentes
// avec les tokens shadcn. La couleur est stockée sous forme de clé string.
export const MODEL_COLORS = [
  "rose",
  "amber",
  "lime",
  "teal",
  "sky",
  "violet",
] as const;
export type ModelColor = (typeof MODEL_COLORS)[number];

export function toModelColor(value: string | null | undefined): ModelColor {
  return (MODEL_COLORS as readonly string[]).includes(value ?? "")
    ? (value as ModelColor)
    : "violet";
}

// Classes pour le badge dot + chip. Tailwind v4 fournit la palette par défaut.
export const modelColorClasses: Record<
  ModelColor,
  { dot: string; chip: string }
> = {
  rose: { dot: "bg-rose-500", chip: "bg-rose-100 text-rose-900 border-rose-200" },
  amber: { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-900 border-amber-200" },
  lime: { dot: "bg-lime-500", chip: "bg-lime-100 text-lime-900 border-lime-200" },
  teal: { dot: "bg-teal-500", chip: "bg-teal-100 text-teal-900 border-teal-200" },
  sky: { dot: "bg-sky-500", chip: "bg-sky-100 text-sky-900 border-sky-200" },
  violet: { dot: "bg-violet-500", chip: "bg-violet-100 text-violet-900 border-violet-200" },
};

export async function listModels(
  supabase: SupabaseClient<Database>,
  options: { includeInactive?: boolean } = {},
): Promise<Model[]> {
  const query = supabase
    .from("models")
    .select("*")
    .order("position")
    .order("name");
  const { data } = options.includeInactive
    ? await query
    : await query.eq("status", "active");
  return data ?? [];
}
