import Link from "next/link";
import { LocalTime } from "@/components/features/LocalTime";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getPartner } from "@/lib/circle";
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
  const firstName = extractFirstName(user?.email);
  const nowIso = new Date().toISOString();
  const partner = user ? await getPartner(supabase, user.id) : null;

  const [
    { count: totalPending },
    { count: activeNow },
    { data: upcoming },
    { data: excuses },
  ] = await Promise.all([
    supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("scheduled_at", nowIso),
    supabase
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .gt("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("snooze_reasons")
      .select("id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const pendingTotal = totalPending ?? 0;
  const activeCount = activeNow ?? 0;
  const upcomingList = upcoming ?? [];
  const excusesList = excuses ?? [];
  const isEmpty = pendingTotal === 0 && excusesList.length === 0;

  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">
          {firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pendingTotal > 0
            ? `${pendingTotal} rappel${pendingTotal > 1 ? "s" : ""} en attente.`
            : "Tu es à jour."}
        </p>
      </header>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun rappel pour l&apos;instant.
            </p>
            <p className="text-xs text-muted-foreground">
              Crée ton premier rappel pour démarrer.
            </p>
            <Link
              href="/rappels/nouveau"
              className={button({ variant: "primary", size: "sm", className: "mt-2" })}
            >
              Créer mon premier rappel
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-5xl font-medium leading-none tracking-tight tabular-nums">
              {activeCount}
            </span>
            <p className="text-sm text-muted-foreground">
              {activeCount > 0
                ? `à traiter maintenant`
                : "tout est à jour"}
            </p>
          </CardContent>
        </Card>
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
                    partnerName={partner?.display_name ?? null}
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
