import Link from "next/link";
import { CategoryFilter } from "@/components/features/CategoryFilter";
import { ReminderFilters } from "@/components/features/ReminderFilters";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { ReminderSearch } from "@/components/features/ReminderSearch";
import { button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getMembersNameMap, getPartner } from "@/lib/circle";
import { listModels } from "@/lib/models";
import { createClient } from "@/lib/supabase/server";

type Filter = "pending" | "done" | "all";

function parseFilter(raw: string | undefined): Filter {
  if (raw === "done" || raw === "all") return raw;
  return "pending";
}

function escapeIlike(q: string): string {
  return q.replace(/[%_\\]/g, (m) => `\\${m}`);
}

type AssigneeFilter = "all" | "me" | "partner" | "both";

export default async function RappelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    category?: string;
    q?: string;
    model?: string;
    priority?: string;
    assignee?: string;
  }>;
}) {
  const {
    filter: rawFilter,
    category: rawCategory,
    q: rawQ,
    model: rawModel,
    priority: rawPriority,
    assignee: rawAssignee,
  } = await searchParams;
  const filter = parseFilter(rawFilter);
  const category = rawCategory?.trim() || null;
  const q = rawQ?.trim() || null;
  const modelFilter = rawModel?.trim() || null;
  const priorityFilter = (
    rawPriority === "urgent" || rawPriority === "low" || rawPriority === "normal"
      ? rawPriority
      : null
  ) as "urgent" | "normal" | "low" | null;
  const assigneeFilter = (
    rawAssignee === "me" ||
    rawAssignee === "partner" ||
    rawAssignee === "both"
      ? rawAssignee
      : "all"
  ) as AssigneeFilter;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [partner, membersNameMap, allModels] = await Promise.all([
    user ? getPartner(supabase, user.id) : Promise.resolve(null),
    user ? getMembersNameMap(supabase, user.id) : Promise.resolve(new Map<string, string>()),
    listModels(supabase, { includeInactive: true }),
  ]);
  const modelById = new Map(
    allModels.map((m) => [m.id, { name: m.name, color: m.color }]),
  );
  const activeModels = allModels.filter((m) => m.status === "active");

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
  ).sort();

  let query = supabase
    .from("reminders")
    .select("*")
    .order("scheduled_at", { ascending: true });
  if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "done") query = query.eq("status", "done");
  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("message", `%${escapeIlike(q)}%`);
  if (modelFilter) query = query.eq("model_id", modelFilter);
  if (priorityFilter) query = query.eq("priority", priorityFilter);
  if (assigneeFilter === "me" && user) query = query.eq("assigned_to", user.id);
  else if (assigneeFilter === "partner" && partner)
    query = query.eq("assigned_to", partner.id);
  else if (assigneeFilter === "both") query = query.is("assigned_to", null);

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

      <div className="space-y-3">
        <ReminderSearch />
        <ReminderFilters />
        {activeModels.length > 0 && (
          <ModelChips
            models={activeModels}
            current={modelFilter}
          />
        )}
        <PriorityChips current={priorityFilter} />
        {partner && (
          <AssigneeChips
            current={assigneeFilter}
            partnerName={partner.display_name ?? "Lui"}
          />
        )}
        <CategoryFilter categories={categories} />
      </div>

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
                    modelById={modelById}
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

// Inline sub-components — petites filtres spécifiques à cette page.
// Server components qui rendent des Link (pas besoin de client comp).

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={
        "rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground")
      }
    >
      {children}
    </Link>
  );
}

function ModelChips({
  models,
  current,
}: {
  models: { id: string; name: string }[];
  current: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterLink href="/rappels" active={!current}>
        Toutes models
      </FilterLink>
      {models.map((m) => (
        <FilterLink
          key={m.id}
          href={`/rappels?model=${encodeURIComponent(m.id)}`}
          active={current === m.id}
        >
          {m.name}
        </FilterLink>
      ))}
    </div>
  );
}

function PriorityChips({
  current,
}: {
  current: "urgent" | "normal" | "low" | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterLink href="/rappels" active={!current}>
        Toutes priorités
      </FilterLink>
      <FilterLink href="/rappels?priority=urgent" active={current === "urgent"}>
        Urgent
      </FilterLink>
      <FilterLink href="/rappels?priority=low" active={current === "low"}>
        Low
      </FilterLink>
    </div>
  );
}

function AssigneeChips({
  current,
  partnerName,
}: {
  current: AssigneeFilter;
  partnerName: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterLink href="/rappels" active={current === "all"}>
        Tout le monde
      </FilterLink>
      <FilterLink href="/rappels?assignee=me" active={current === "me"}>
        Moi
      </FilterLink>
      <FilterLink href="/rappels?assignee=partner" active={current === "partner"}>
        {partnerName}
      </FilterLink>
      <FilterLink href="/rappels?assignee=both" active={current === "both"}>
        Nous deux
      </FilterLink>
    </div>
  );
}
