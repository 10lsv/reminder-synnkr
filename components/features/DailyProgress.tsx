"use client";

import { useEffect, useState } from "react";

interface DayRow {
  id: string;
  status: string;
  scheduled_at: string;
}

interface DailyProgressProps {
  rappels: DayRow[];
}

// Brutalist: progress bar mono ASCII-like (segments + ratio en mono).
const SEGMENTS = 22;

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
  const filled = Math.round((stats.done / stats.total) * SEGMENTS);
  const empty = SEGMENTS - filled;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="label-mono">Aujourd&apos;hui</span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {stats.done}/{stats.total}{" "}
          <span className="text-muted-foreground">· {pct}%</span>
        </span>
      </div>
      <div
        className="font-mono text-[11px] leading-none tracking-[0.18em] text-foreground"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="text-foreground">{"█".repeat(filled)}</span>
        <span className="text-muted-foreground/40">
          {"░".repeat(empty)}
        </span>
      </div>
    </div>
  );
}
