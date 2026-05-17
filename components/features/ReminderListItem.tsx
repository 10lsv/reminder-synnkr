import { Pencil } from "lucide-react";
import Link from "next/link";
import { InlineDeleteReminder } from "@/components/features/InlineDeleteReminder";
import { LocalTime } from "@/components/features/LocalTime";
import { recurrenceLabels } from "@/lib/recurrence";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Reminder = Tables<"reminders">;

const statusLabels: Record<string, string> = {
  done: "Fait",
  snoozed: "Plus tard",
  expired: "Expiré",
};

interface ReminderListItemProps {
  reminder: Reminder;
  showActions?: boolean;
}

export function ReminderListItem({
  reminder,
  showActions = true,
}: ReminderListItemProps) {
  const statusLabel = statusLabels[reminder.status];
  const recurrenceLabel =
    reminder.recurrence !== "none"
      ? recurrenceLabels[reminder.recurrence as "daily" | "weekly" | "monthly"]
      : undefined;

  return (
    <div className="flex items-start gap-2 border-b border-border py-4">
      <Link
        href={`/rappels/${reminder.id}`}
        className="flex flex-1 flex-col gap-1 min-w-0"
      >
        <p className="line-clamp-2 text-base text-fg">{reminder.message}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
          <span>
            <LocalTime iso={reminder.scheduled_at} />
          </span>
          {reminder.circle_id && (
            <>
              <span aria-hidden>·</span>
              <span className="rounded-pill border border-accent-strong bg-accent-bg px-2 py-0.5 text-xs uppercase tracking-label text-accent-strong">
                Commun
              </span>
            </>
          )}
          {reminder.category && (
            <>
              <span aria-hidden>·</span>
              <span className="uppercase tracking-label text-xs text-fg-tertiary">
                {reminder.category}
              </span>
            </>
          )}
          {recurrenceLabel && (
            <>
              <span aria-hidden>·</span>
              <span aria-label="récurrence">↻ {recurrenceLabel}</span>
            </>
          )}
          {statusLabel && (
            <>
              <span aria-hidden>·</span>
              <span>{statusLabel}</span>
            </>
          )}
        </div>
      </Link>
      {showActions && (
        <div className="flex items-center gap-1 pt-1">
          <Link
            href={`/rappels/${reminder.id}`}
            aria-label="Modifier"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-pill",
              "text-fg-secondary hover:text-fg transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
            )}
          >
            <Pencil size={18} strokeWidth={2} aria-hidden />
          </Link>
          <InlineDeleteReminder id={reminder.id} />
        </div>
      )}
    </div>
  );
}
