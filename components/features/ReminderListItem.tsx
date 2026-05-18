import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { InlineDeleteReminder } from "@/components/features/InlineDeleteReminder";
import { LocalTime } from "@/components/features/LocalTime";
import { recurrenceLabels } from "@/lib/recurrence";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Reminder = Tables<"reminders">;

interface ReminderListItemProps {
  reminder: Reminder;
  showActions?: boolean;
  partnerName?: string | null;
  userNameById?: Map<string, string>;
  currentUserId?: string;
}

export function ReminderListItem({
  reminder,
  showActions = true,
  partnerName = null,
  userNameById,
  currentUserId,
}: ReminderListItemProps) {
  const isDone = reminder.status === "done";
  const isUrgent = reminder.priority === "urgent" && !isDone;
  const isLow = reminder.priority === "low";
  const isShared = Boolean(reminder.circle_id);
  const creatorIsMe = reminder.user_id === currentUserId;
  const creatorName =
    isShared && !creatorIsMe
      ? userNameById?.get(reminder.user_id) ?? partnerName
      : null;
  const recurrenceLabel =
    reminder.recurrence !== "none"
      ? recurrenceLabels[reminder.recurrence as "daily" | "weekly" | "monthly"]
      : undefined;

  // Préfixe ASCII : ! pour urgent, x pour done, > pour shared, · sinon.
  const prefix = isUrgent ? "!" : isDone ? "✓" : isShared ? "→" : "·";

  return (
    <div
      className={cn(
        "group/item relative flex items-stretch gap-3 py-3 transition-colors",
        isUrgent && "bg-destructive/5",
        isDone && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "ml-0 mt-0.5 w-3 select-none text-center font-mono text-[14px] font-medium leading-tight",
          isUrgent && "text-destructive animate-pulse-dot",
          isDone && "text-success",
          isShared && !isUrgent && !isDone && "text-accent-foreground",
          !isUrgent && !isDone && !isShared && "text-muted-foreground",
        )}
      >
        {prefix}
      </span>

      <Link
        href={`/rappels/${reminder.id}`}
        className="flex flex-1 flex-col gap-1 min-w-0"
      >
        <p
          className={cn(
            "line-clamp-2 text-[15px] leading-snug",
            isUrgent
              ? "font-medium text-destructive uppercase tracking-tight"
              : isDone
                ? "line-through text-muted-foreground"
                : isLow
                  ? "text-muted-foreground"
                  : "text-foreground",
          )}
        >
          {reminder.message}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <span className="tabular-nums">
            <LocalTime iso={reminder.scheduled_at} />
          </span>
          {reminder.category && (
            <>
              <span aria-hidden>·</span>
              <span>{reminder.category}</span>
            </>
          )}
          {creatorName && (
            <>
              <span aria-hidden>·</span>
              <span>par {creatorName}</span>
            </>
          )}
          {recurrenceLabel && (
            <>
              <span aria-hidden>·</span>
              <span>↻ {recurrenceLabel}</span>
            </>
          )}
        </div>
      </Link>

      {showActions ? (
        <div className="flex items-center gap-0">
          <Link
            href={`/rappels/${reminder.id}`}
            aria-label="Modifier"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowUpRight size={16} strokeWidth={2} />
          </Link>
          <InlineDeleteReminder id={reminder.id} />
        </div>
      ) : (
        <Link
          href={`/rappels/${reminder.id}`}
          aria-label="Ouvrir"
          className="flex items-center text-muted-foreground transition-colors group-hover/item:text-foreground"
        >
          <ArrowUpRight size={14} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
