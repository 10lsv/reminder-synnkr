import Link from "next/link";
import { button } from "@/components/ui/Button";
import { LocalTime } from "@/components/features/LocalTime";
import { ReminderListItem } from "@/components/features/ReminderListItem";
import { SectionLabel } from "@/components/ui/SectionLabel";
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
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Bonjour {firstName}</h1>
        {pendingTotal > 0 && (
          <p className="text-sm text-fg-secondary">
            {pendingTotal} rappel{pendingTotal > 1 ? "s" : ""} en attente
          </p>
        )}
      </header>

      {isEmpty ? (
        <section className="flex flex-col items-center gap-6 py-12 text-center">
          <p className="text-base text-fg-secondary">
            Aucun rappel pour l&apos;instant.
          </p>
          <Link
            href="/rappels/nouveau"
            className={button({ variant: "primary" })}
          >
            Créer mon premier rappel
          </Link>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-3 py-4">
          <span className="text-hero font-bold leading-none tracking-tight text-fg tabular-nums">
            {activeCount}
          </span>
          <SectionLabel withDot>
            {activeCount > 1
              ? "À traiter maintenant"
              : activeCount === 1
                ? "À traiter maintenant"
                : "Tout est à jour"}
          </SectionLabel>
        </section>
      )}

      {upcomingList.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionLabel withDot>Prochains rappels</SectionLabel>
          <ul className="flex flex-col">
            {upcomingList.map((reminder) => (
              <li key={reminder.id}>
                <ReminderListItem reminder={reminder} showActions={false} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {excusesList.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionLabel withDot>Tes excuses</SectionLabel>
          <ul className="flex flex-col gap-3">
            {excusesList.map((excuse) => (
              <li key={excuse.id} className="flex flex-col gap-1">
                <p className="text-base italic text-fg-secondary">
                  « {excuse.reason} »
                </p>
                {excuse.created_at && (
                  <p className="text-xs text-fg-tertiary">
                    <LocalTime iso={excuse.created_at} />
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/excuses"
            className="self-start text-sm text-fg-secondary underline-offset-4 hover:underline"
          >
            Voir toutes les excuses
          </Link>
        </section>
      )}
    </main>
  );
}
