import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { DailyProgress } from "@/components/features/DailyProgress";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { TodayLabel } from "@/components/features/TodayLabel";
import { getMembersNameMap, getPartner } from "@/lib/circle";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

function extractFirstName(email: string | undefined): string {
  if (!email) return "";
  const slug = email.split("@")[0] ?? "";
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const firstName = profile?.display_name ?? extractFirstName(user?.email);
  const nowIso = new Date().toISOString();
  const partner = user ? await getPartner(supabase, user.id) : null;
  const partnerName = partner?.display_name ?? null;

  const dayWindowStart = new Date();
  dayWindowStart.setUTCHours(0, 0, 0, 0);
  const dayLowerIso = new Date(
    dayWindowStart.getTime() - 12 * 60 * 60 * 1000,
  ).toISOString();
  const dayUpperIso = new Date(
    dayWindowStart.getTime() + 36 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { count: totalPending },
    { data: pendingRows },
    { data: dayRows },
    { data: upcoming },
    membersNameMap,
  ] = await Promise.all([
    supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reminders")
      .select("id, user_id, circle_id, priority")
      .eq("status", "pending"),
    supabase
      .from("reminders")
      .select("id, status, scheduled_at")
      .gte("scheduled_at", dayLowerIso)
      .lte("scheduled_at", dayUpperIso),
    supabase
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .gt("scheduled_at", nowIso)
      .order("priority", { ascending: false })
      .order("scheduled_at", { ascending: true })
      .limit(5),
    user
      ? getMembersNameMap(supabase, user.id)
      : Promise.resolve(new Map<string, string>()),
  ]);

  const pendingTotal = totalPending ?? 0;
  const pending = pendingRows ?? [];
  const personalCount = user
    ? pending.filter((r) => !r.circle_id && r.user_id === user.id).length
    : 0;
  const sharedCount = pending.filter((r) => Boolean(r.circle_id)).length;
  const urgentCount = pending.filter((r) => r.priority === "urgent").length;
  const upcomingList = upcoming ?? [];
  const isEmpty = pendingTotal === 0;
  const dayRowsList = dayRows ?? [];

  return (
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      {/* Date stamp + greeting */}
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">
          <TodayLabel mode="stamp" />
        </p>
        <h1 className="mt-3 text-[34px] font-medium leading-none tracking-tight">
          {firstName ? `Bonjour ${firstName}.` : "Tableau de bord."}
        </h1>
      </section>

      {isEmpty ? (
        <section className="px-4 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            // tu es à jour
          </p>
          <p className="mt-3 text-2xl font-medium leading-tight">
            Aucun rappel programmé.
          </p>
          <Link
            href="/rappels/nouveau"
            className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground hover:underline"
          >
            Créer le premier
            <ArrowUpRight size={14} strokeWidth={2} />
          </Link>
        </section>
      ) : (
        <>
          {/* Stats grid */}
          <section className="grid grid-cols-3 divide-x divide-foreground">
            <StatCell label="Perso" value={personalCount} />
            <StatCell label="Partagé" value={sharedCount} />
            <StatCell
              label="Urgent"
              value={urgentCount}
              highlight={urgentCount > 0}
            />
          </section>

          {/* Daily progress */}
          <section className="px-4 py-5">
            <DailyProgress rappels={dayRowsList} />
          </section>
        </>
      )}

      {upcomingList.length > 0 && (
        <section className="px-4 py-5">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="label-mono">À venir</p>
            <Link
              href="/rappels"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              Voir tout →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {upcomingList.map((reminder) => (
              <li key={reminder.id}>
                <ReminderListItem
                  reminder={reminder}
                  showActions={false}
                  partnerName={partnerName}
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

function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const active = value > 0;
  return (
    <div className="flex flex-col items-start gap-3 px-4 py-5">
      <span
        className={cn(
          "label-mono",
          highlight && active && "text-destructive animate-pulse-dot",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[48px] font-medium leading-none tabular-nums tracking-tight",
          highlight && active
            ? "text-destructive"
            : active
              ? "text-foreground"
              : "text-muted-foreground/40",
        )}
      >
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}

