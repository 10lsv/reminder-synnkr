import { computeStreaks } from "@/lib/streaks";
import { createClient } from "@/lib/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: doneRows } = await supabase
    .from("reminders")
    .select("done_at")
    .not("done_at", "is", null);

  const stats = computeStreaks((doneRows ?? []).map((r) => r.done_at));
  const onFire = stats.current >= 3;

  return (
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">Progression</p>
        <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight">
          Stats.
        </h1>
      </section>

      <section className="px-4 py-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="label-mono">
            {onFire ? "Streak actuel · on fire" : "Streak actuel"}
          </p>
          {onFire && (
            <span
              aria-hidden
              className="animate-pulse-dot font-mono text-[11px] uppercase tracking-[0.14em] text-destructive"
            >
              ●
            </span>
          )}
        </div>
        <p
          className={`mt-3 text-[96px] font-medium leading-none tabular-nums tracking-tight ${onFire ? "text-destructive" : "text-foreground"}`}
        >
          {String(stats.current).padStart(2, "0")}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          jour{stats.current > 1 ? "s" : ""} d&apos;affilée
        </p>
        <p className="mt-4 max-w-sm text-[13px] text-muted-foreground">
          {stats.current === 0
            ? "Marque un rappel comme fait aujourd'hui pour lancer la série."
            : "Continue demain pour grimper."}
        </p>
      </section>

      <section className="grid grid-cols-2 divide-x divide-foreground">
        <Stat label="Plus longue série" value={stats.longest} suffix="j" />
        <Stat label="Total faits" value={stats.totalDone} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-4 py-5">
      <span className="label-mono">{label}</span>
      <span className="text-[40px] font-medium leading-none tabular-nums tracking-tight">
        {String(value).padStart(2, "0")}
        {suffix && (
          <span className="ml-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
