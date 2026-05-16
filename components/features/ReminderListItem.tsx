import Link from "next/link";
import { formatRelative } from "@/lib/dates";
import { recurrenceLabels } from "@/lib/recurrence";
import type { Tables } from "@/types/database";

type Reminder = Tables<"reminders">;

const statusLabels: Record<string, string> = {
  done: "Fait",
  snoozed: "Plus tard",
  expired: "Expiré",
};

export function ReminderListItem({ reminder }: { reminder: Reminder }) {
  const statusLabel = statusLabels[reminder.status];
  const recurrenceLabel =
    reminder.recurrence !== "none"
      ? recurrenceLabels[reminder.recurrence as "daily" | "weekly" | "monthly"]
      : undefined;
  return (
    <Link
      href={`/rappels/${reminder.id}`}
      className="flex flex-col gap-1 border-b border-border py-4"
    >
      <p className="line-clamp-2 text-base text-fg">{reminder.message}</p>
      <div className="flex items-center gap-2 text-sm text-fg-secondary">
        <span>{formatRelative(reminder.scheduled_at)}</span>
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
  );
}
