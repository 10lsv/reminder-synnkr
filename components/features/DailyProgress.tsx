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
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">
          Aujourd&apos;hui
        </span>
        <span
          className={cn(
            "tabular-nums",
            isComplete ? "text-success" : "text-muted-foreground",
          )}
        >
          {stats.done} / {stats.total}
          <span className="ml-1 text-[10px]">({pct}%)</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-destructive/20"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-success transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
