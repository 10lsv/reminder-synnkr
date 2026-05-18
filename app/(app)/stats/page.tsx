import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
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
    <div className="page-enter space-y-6">
      <header className="space-y-1 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Ma progression
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">Stats</h1>
      </header>

      <Card
        padding="lg"
        className="relative space-y-3 overflow-hidden border-0 bg-foreground p-8 text-background ring-0 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_18px_40px_-18px_rgba(0,0,0,0.45)]"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Flame
            className={onFire ? "size-6 text-destructive" : "size-6 text-accent"}
            strokeWidth={1.8}
          />
          <span className="text-[64px] font-medium leading-none tabular-nums tracking-tight">
            {stats.current}
          </span>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-background/60">
            jour{stats.current > 1 ? "s" : ""} d&apos;affilée
          </p>
          <p className="max-w-xs text-[13px] text-background/70">
            {stats.current === 0
              ? "Marque un rappel comme fait aujourd'hui pour lancer la série."
              : "Continue demain pour grimper."}
          </p>
        </div>
      </Card>

      <Card padding="lg">
        <CardContent className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Compteurs
          </p>
          <ul className="space-y-0">
            <li className="flex items-baseline justify-between border-b border-border/60 py-3">
              <span className="text-sm text-muted-foreground">
                Plus longue série
              </span>
              <span className="text-[20px] font-medium tabular-nums">
                {stats.longest}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  jour{stats.longest > 1 ? "s" : ""}
                </span>
              </span>
            </li>
            <li className="flex items-baseline justify-between py-3">
              <span className="text-sm text-muted-foreground">Total faits</span>
              <span className="text-[20px] font-medium tabular-nums">
                {stats.totalDone}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
