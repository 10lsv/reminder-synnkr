import { Sparkles, User, Users, Zap } from "lucide-react";
import Link from "next/link";
import { DailyProgress } from "@/components/features/DailyProgress";
import { LocalTime } from "@/components/features/LocalTime";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { TodayLabel } from "@/components/features/TodayLabel";
import { button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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

  // Fenêtre "jour" élargie (-12h / +36h UTC) pour couvrir n'importe quelle
  // TZ utilisateur. Le filtre exact en TZ navigateur se fait dans
  // <DailyProgress />.
  const dayWindowStart = new Date();
  dayWindowStart.setUTCHours(0, 0, 0, 0);
  dayWindowStart.setUTCDate(dayWindowStart.getUTCDate());
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
    { data: excuses },
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
    supabase
      .from("snooze_reasons")
      .select("id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    user
      ? getMembersNameMap(supabase, user.id)
      : Promise.resolve(new Map<string, string>()),
  ]);

  const pendingTotal = totalPending ?? 0;
  const pending = pendingRows ?? [];
  // 3 facettes orthogonales :
  // - "Pour toi" : pending perso (pas dans le cercle commun).
  // - "En commun" : pending communs (visibles par les deux).
  // - "Urgent" : tous les pending dont priority = urgent (toutes scopes).
  const personalCount = user
    ? pending.filter((r) => !r.circle_id && r.user_id === user.id).length
    : 0;
  const sharedCount = pending.filter((r) => Boolean(r.circle_id)).length;
  const urgentCount = pending.filter((r) => r.priority === "urgent").length;
  const upcomingList = upcoming ?? [];
  const excusesList = excuses ?? [];
  const isEmpty = pendingTotal === 0 && excusesList.length === 0;
  const dayRowsList = dayRows ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1 pt-2 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <TodayLabel />
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">
          {firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        </h1>
      </header>

      {isEmpty ? (
        <Card padding="lg">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent/30">
              <Sparkles className="size-5 text-accent-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium">Tu es à jour</p>
              <p className="text-sm text-muted-foreground">
                Aucun rappel pour l&apos;instant.
              </p>
            </div>
            <Link
              href="/rappels/nouveau"
              className={button({
                variant: "primary",
                size: "sm",
                className: "mt-1",
              })}
            >
              Créer mon premier rappel
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card
          padding="lg"
          className="relative space-y-5 overflow-hidden bg-gradient-to-br from-accent/12 via-card to-card p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ring-border/40"
        >
          <div className="grid grid-cols-3 divide-x divide-border/60">
            <StatCell
              icon={User}
              label="Pour toi"
              value={personalCount}
            />
            <StatCell
              icon={Users}
              label="En commun"
              value={sharedCount}
            />
            <StatCell
              icon={Zap}
              label="Urgent"
              value={urgentCount}
              highlight={urgentCount > 0 ? "urgent" : undefined}
            />
          </div>
          <DailyProgress rappels={dayRowsList} />
        </Card>
      )}

      {upcomingList.length > 0 && (
        <Card padding="lg">
          <CardHeader className="mb-4">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em]">
              Prochains rappels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <ul className="flex flex-col">
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
          </CardContent>
        </Card>
      )}

      {excusesList.length > 0 && (
        <Card padding="lg">
          <CardHeader className="mb-4">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em]">
              Tes excuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {excusesList.map((excuse) => (
                <li key={excuse.id} className="space-y-1">
                  <p className="text-[15px] leading-snug italic text-foreground">
                    « {excuse.reason} »
                  </p>
                  {excuse.created_at && (
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <LocalTime iso={excuse.created_at} />
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Link
              href="/excuses"
              className="inline-flex text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Voir toutes les excuses →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof User;
  label: string;
  value: number;
  highlight?: "urgent";
}) {
  const isUrgent = highlight === "urgent" && value > 0;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 px-2 py-2",
        isUrgent && "text-destructive",
      )}
    >
      <Icon
        className={cn(
          "size-[20px]",
          isUrgent
            ? "text-destructive"
            : value > 0
              ? "text-foreground/80"
              : "text-muted-foreground/60",
        )}
        strokeWidth={1.8}
      />
      <span
        className={cn(
          "text-[40px] font-medium leading-none tabular-nums tracking-tight",
          isUrgent && "text-destructive",
        )}
      >
        {value}
      </span>
      <p
        className={cn(
          "text-[10px] font-medium uppercase tracking-[0.14em]",
          isUrgent ? "text-destructive/80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  );
}
