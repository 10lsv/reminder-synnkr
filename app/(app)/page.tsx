import Link from "next/link";
import { DailyProgress } from "@/components/features/DailyProgress";
import { LocalTime } from "@/components/features/LocalTime";
import { ReminderListItem } from "@/components/features/ReminderListItem";
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

  return (
    <div className="space-y-5">
      <header className="pt-2 text-center">
        <h1 className="text-2xl font-medium tracking-tight">
          {firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        </h1>
      </header>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <HeroStat label="Pour toi" value={personalCount} />
            <HeroStat label="En commun" value={sharedCount} />
            <HeroStat label="Urgent" value={urgentCount} highlight="urgent" />
          </div>
          <DailyProgress rappels={dayRows ?? []} />
        </>
      )}

      {upcomingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prochains rappels</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Tes excuses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {excusesList.map((excuse) => (
                <li key={excuse.id} className="space-y-0.5">
                  <p className="text-sm italic text-foreground">
                    « {excuse.reason} »
                  </p>
                  {excuse.created_at && (
                    <p className="text-xs text-muted-foreground">
                      <LocalTime iso={excuse.created_at} />
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Link
              href="/excuses"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Voir toutes les excuses →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeroStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "urgent";
}) {
  const isUrgent = highlight === "urgent" && value > 0;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-4 text-center ring-1 ring-border/60",
        isUrgent ? "bg-destructive/10 ring-destructive/30" : "bg-card",
      )}
    >
      <span
        className={cn(
          "text-3xl font-medium leading-none tabular-nums",
          isUrgent && "text-destructive",
        )}
      >
        {value}
      </span>
      <p
        className={cn(
          "text-[10px] uppercase tracking-wider",
          isUrgent ? "text-destructive/80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  );
}
