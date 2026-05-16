import { SectionLabel } from "@/components/ui/SectionLabel";
import { computeStreaks } from "@/lib/streaks";
import { createClient } from "@/lib/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: doneRows } = await supabase
    .from("reminders")
    .select("done_at")
    .not("done_at", "is", null);

  const stats = computeStreaks((doneRows ?? []).map((r) => r.done_at));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-12 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Stats</h1>
      </header>

      <section className="flex flex-col items-center gap-3 py-4">
        <span className="text-hero font-bold leading-none tracking-tight text-fg tabular-nums">
          {stats.current}
        </span>
        <SectionLabel withDot>Jours d&apos;affilée</SectionLabel>
        {stats.current === 0 ? (
          <p className="text-center text-sm text-fg-secondary">
            Marque un rappel comme fait aujourd&apos;hui pour lancer la série.
          </p>
        ) : (
          <p className="text-center text-sm text-fg-secondary">
            Continue demain pour grimper.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel withDot>Compteurs</SectionLabel>
        <ul className="flex flex-col gap-3">
          <li className="flex items-baseline justify-between border-b border-border pb-3">
            <span className="text-sm text-fg-secondary">Plus longue série</span>
            <span className="text-lg font-medium text-fg tabular-nums">
              {stats.longest}{" "}
              <span className="text-sm font-normal text-fg-tertiary">
                jour{stats.longest > 1 ? "s" : ""}
              </span>
            </span>
          </li>
          <li className="flex items-baseline justify-between">
            <span className="text-sm text-fg-secondary">Total faits</span>
            <span className="text-lg font-medium text-fg tabular-nums">
              {stats.totalDone}
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}
