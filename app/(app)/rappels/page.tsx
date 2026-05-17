import Link from "next/link";
import { CategoryFilter } from "@/components/features/CategoryFilter";
import { ReminderFilters } from "@/components/features/ReminderFilters";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { ReminderSearch } from "@/components/features/ReminderSearch";
import { button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getMembersNameMap, getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

type Filter = "pending" | "done" | "all";

function parseFilter(raw: string | undefined): Filter {
  if (raw === "done" || raw === "all") return raw;
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
    .order("scheduled_at", { ascending: true });
  if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "done") query = query.eq("status", "done");
  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("message", `%${escapeIlike(q)}%`);
  if (priorityFilter) query = query.eq("priority", priorityFilter);

  const { data: reminders } = await query;
  const list = reminders ?? [];
  const isEmpty = list.length === 0;
  const isFirstTime = (totalCount ?? 0) === 0;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Tes rappels</h1>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">{pendingCount ?? 0}</span> en attente
          </p>
        </div>
        <Link
          href="/rappels/nouveau"
          className={button({ variant: "primary", size: "sm" })}
        >
          Nouveau
        </Link>
      </header>

      <Card>
        <CardContent className="space-y-3">
          <ReminderSearch />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ReminderFilters />
            <PriorityChips current={priorityFilter} />
          </div>
          {categories.length > 0 && <CategoryFilter categories={categories} />}
        </CardContent>
      </Card>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            {isFirstTime ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Aucun rappel pour l&apos;instant.
                </p>
                <Link
                  href="/rappels/nouveau"
                  className={button({
                    variant: "primary",
                    size: "sm",
                    className: "mt-2",
                  })}
                >
                  Créer mon premier rappel
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun rappel ne correspond aux filtres.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-0">
            <ul className="flex flex-col">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PriorityChips({
  current,
}: {
  current: "urgent" | "normal" | "low" | null;
}) {
  const chips: { value: "urgent" | "low" | null; label: string }[] = [
    { value: null, label: "Toutes" },
    { value: "urgent", label: "Urgent" },
    { value: "low", label: "Low" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => {
        const href =
          c.value === null
            ? "/rappels"
            : `/rappels?priority=${c.value}`;
        const active = c.value === current;
        return (
          <Link
            key={c.value ?? "all"}
            href={href}
            className={
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-muted-foreground")
            }
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
