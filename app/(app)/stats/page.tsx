import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">Stats</h1>
        <p className="text-sm text-muted-foreground">
          Tes séries et compteurs.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="text-5xl font-medium leading-none tracking-tight tabular-nums">
            {stats.current}
          </span>
          <p className="text-sm text-muted-foreground">
            jour{stats.current > 1 ? "s" : ""} d&apos;affilée
          </p>
          <p className="mt-3 max-w-xs text-xs text-muted-foreground">
            {stats.current === 0
              ? "Marque un rappel comme fait aujourd'hui pour lancer la série."
              : "Continue demain pour grimper."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-baseline justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted-foreground">
                Plus longue série
              </span>
              <span className="text-base font-medium tabular-nums">
                {stats.longest}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  jour{stats.longest > 1 ? "s" : ""}
                </span>
              </span>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total faits</span>
              <span className="text-base font-medium tabular-nums">
                {stats.totalDone}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
