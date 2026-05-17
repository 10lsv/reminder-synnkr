import Link from "next/link";
import { button } from "@/components/ui/Button";
import { CategoryFilter } from "@/components/features/CategoryFilter";
import { ReminderFilters } from "@/components/features/ReminderFilters";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { ReminderSearch } from "@/components/features/ReminderSearch";
import { getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

type Filter = "pending" | "done" | "all";

function parseFilter(raw: string | undefined): Filter {
  if (raw === "done" || raw === "all") return raw;
  return "pending";
}

// Échappe les caractères pattern de PostgreSQL ilike pour qu'une saisie
// utilisateur soit interprétée littéralement.
function escapeIlike(q: string): string {
  return q.replace(/[%_\\]/g, (m) => `\\${m}`);
}

export default async function RappelsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string; q?: string }>;
}) {
  const {
    filter: rawFilter,
    category: rawCategory,
    q: rawQ,
  } = await searchParams;
  const filter = parseFilter(rawFilter);
  const category = rawCategory?.trim() || null;
  const q = rawQ?.trim() || null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const partner = user ? await getPartner(supabase, user.id) : null;

  const { count: pendingCount } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: totalCount } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true });

  // Liste des catégories distinctes utilisées par le user (pour les chips
  // de filtre). On lit toutes les valeurs non-null et on dédoublonne en JS,
  // Postgres distinct via supabase-js demande un view ou rpc.
  const { data: categoryRows } = await supabase
    .from("reminders")
    .select("category")
    .not("category", "is", null);
  const categories = Array.from(
    new Set(
      (categoryRows ?? [])
        .map((r) => r.category)
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort();

  let query = supabase
    .from("reminders")
    .select("*")
    .order("scheduled_at", { ascending: true });
  if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "done") query = query.eq("status", "done");
  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("message", `%${escapeIlike(q)}%`);

  const { data: reminders } = await query;
  const list = reminders ?? [];
  const isEmpty = list.length === 0;
  const isFirstTime = (totalCount ?? 0) === 0;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10 pb-48">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Tes rappels</h1>
        <p className="text-sm text-fg-secondary">
          {pendingCount ?? 0} en attente
        </p>
      </header>

      <ReminderSearch />

      <ReminderFilters />

      <CategoryFilter categories={categories} />

      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          {isFirstTime ? (
            <>
              <p className="text-base text-fg-secondary">
                Aucun rappel pour l&apos;instant.
              </p>
              <Link
                href="/rappels/nouveau"
                className={button({ variant: "primary" })}
              >
                Créer mon premier rappel
              </Link>
            </>
          ) : (
            <p className="text-base text-fg-secondary">
              {q
                ? `Aucun rappel ne contient « ${q} ».`
                : filter === "done"
                  ? "Aucun rappel fait pour le moment."
                  : filter === "pending"
                    ? "Aucun rappel en attente."
                    : "Aucun rappel."}
            </p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col">
          {list.map((reminder) => (
            <li key={reminder.id}>
              <ReminderListItem
                reminder={reminder}
                partnerName={partner?.display_name ?? null}
              />
            </li>
          ))}
        </ul>
      )}

      {!isEmpty && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[80px] z-30">
          <div
            aria-hidden
            className="h-6 bg-gradient-to-t from-bg to-transparent"
          />
          <div className="pointer-events-auto bg-bg px-6 pb-4 pt-2">
            <div className="mx-auto max-w-2xl">
              <Link
                href="/rappels/nouveau"
                className={button({ variant: "primary", fullWidth: true })}
              >
                Nouveau rappel
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
