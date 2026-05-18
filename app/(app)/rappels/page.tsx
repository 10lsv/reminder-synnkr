import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/features/CategoryFilter";
import { ReminderFilters } from "@/components/features/ReminderFilters";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { ReminderSearch } from "@/components/features/ReminderSearch";
import { getMembersNameMap, getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

type Filter = "pending" | "done" | "recurring" | "all";

function parseFilter(raw: string | undefined): Filter {
  if (raw === "done" || raw === "all" || raw === "recurring") return raw;
  return "pending";
}

function escapeIlike(q: string): string {
  return q.replace(/[%_\\]/g, (m) => `\\${m}`);
}

export default async function RappelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    category?: string;
    q?: string;
    priority?: string;
  }>;
}) {
  const {
    filter: rawFilter,
    category: rawCategory,
    q: rawQ,
    priority: rawPriority,
  } = await searchParams;
  const filter = parseFilter(rawFilter);
  const category = rawCategory?.trim() || null;
  const q = rawQ?.trim() || null;
  const priorityFilter = (
    rawPriority === "urgent" || rawPriority === "low" || rawPriority === "normal"
      ? rawPriority
      : null
  ) as "urgent" | "normal" | "low" | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [partner, membersNameMap] = await Promise.all([
    user ? getPartner(supabase, user.id) : Promise.resolve(null),
    user
      ? getMembersNameMap(supabase, user.id)
      : Promise.resolve(new Map<string, string>()),
  ]);

  const { count: pendingCount } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: totalCount } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true });

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
  ).sort((a, b) => a.localeCompare(b, "fr"));

  let query = supabase
    .from("reminders")
    .select("*")
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true });
  if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "done") query = query.eq("status", "done");
  else if (filter === "recurring") query = query.neq("recurrence", "none");
  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("message", `%${escapeIlike(q)}%`);
  if (priorityFilter) query = query.eq("priority", priorityFilter);

  const { data: reminders } = await query;
  const list = reminders ?? [];
  const isEmpty = list.length === 0;
  const isFirstTime = (totalCount ?? 0) === 0;

  return (
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="flex items-end justify-between gap-4 px-4 py-6">
        <div>
          <p className="brand-mark text-muted-foreground">Rappels</p>
          <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight tabular-nums">
            {pendingCount ?? 0}
            <span className="ml-2 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
              en attente
            </span>
          </h1>
        </div>
        <Link
          href="/rappels/nouveau"
          className="inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-background transition-colors hover:bg-background hover:text-foreground"
        >
          Nouveau
          <ArrowUpRight size={12} strokeWidth={2} />
        </Link>
      </section>

      <section className="space-y-3 px-4 py-4">
        <ReminderSearch />
        <ReminderFilters />
        {categories.length > 0 && <CategoryFilter categories={categories} />}
      </section>

      {isEmpty ? (
        <section className="px-4 py-10">
          {isFirstTime ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                // vide
              </p>
              <p className="mt-3 text-xl font-medium">
                Aucun rappel pour l&apos;instant.
              </p>
              <Link
                href="/rappels/nouveau"
                className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground hover:underline"
              >
                Créer le premier
                <ArrowUpRight size={14} strokeWidth={2} />
              </Link>
            </>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              // aucun rappel ne correspond aux filtres
            </p>
          )}
        </section>
      ) : (
        <section className="px-4">
          <ul className="divide-y divide-border">
            {list.map((reminder) => (
              <li key={reminder.id}>
                <ReminderListItem
                  reminder={reminder}
                  partnerName={partner?.display_name ?? null}
                  userNameById={membersNameMap}
                  currentUserId={user?.id}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
