"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DayRow {
  id: string;
  status: string;
  scheduled_at: string;
}

interface DailyProgressProps {
  rappels: DayRow[];
}

// Compteur des rappels du jour (en TZ navigateur — donc cohérent avec
// l'affichage). Server peut pas savoir la TZ user, donc tout se passe ici.
export function DailyProgress({ rappels }: DailyProgressProps) {
  const [stats, setStats] = useState<{ done: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const today = rappels.filter((r) => {
      const d = new Date(r.scheduled_at);
      return d >= start && d < end;
    });
    setStats({
      total: today.length,
      done: today.filter((r) => r.status === "done").length,
    });
  }, [rappels]);

  if (!stats || stats.total === 0) return null;

  const pct = Math.round((stats.done / stats.total) * 100);
  const isComplete = stats.done === stats.total;

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Aujourd&apos;hui
        </span>
        <span className="flex items-baseline gap-1.5 tabular-nums">
          <span
            className={cn(
              "text-sm font-medium",
              isComplete ? "text-success" : "text-foreground",
            )}
          >
            {stats.done}
            <span className="text-muted-foreground">/{stats.total}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">{pct}%</span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            isComplete ? "bg-success" : "bg-foreground",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
