import { AlertCircle, Pencil } from "lucide-react";
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
  partnerName?: string | null;
  // Map user_id → display_name (pour résoudre le créateur d'un rappel commun
  // si on veut afficher "par Lélio").
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
  const statusLabel = statusLabels[reminder.status];
  const recurrenceLabel =
    reminder.recurrence !== "none"
      ? recurrenceLabels[reminder.recurrence as "daily" | "weekly" | "monthly"]
      : undefined;
  const isDone = reminder.status === "done";
  const isUrgent = reminder.priority === "urgent" && !isDone;
  const isLow = reminder.priority === "low";
  const isShared = Boolean(reminder.circle_id);
  const creatorIsMe = reminder.user_id === currentUserId;
  const creatorName =
    isShared && !creatorIsMe
      ? userNameById?.get(reminder.user_id) ?? partnerName
      : null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b border-border/60 py-3 last:border-b-0",
        isUrgent && "bg-destructive/10 -mx-2 px-2 my-1 rounded-md border-transparent",
        isDone && "bg-success/10 -mx-2 px-2 rounded-md border-transparent",
      )}
    >
      <div className="flex w-4 flex-col items-center pt-1.5">
        {isUrgent ? (
          <AlertCircle
            className="size-3.5 text-destructive"
            aria-label="Urgent"
          />
        ) : isShared ? (
          <span className="size-2 rounded-full bg-accent" aria-hidden />
        ) : (
          <span
            className={cn(
              "size-2 rounded-full",
              isLow ? "bg-muted" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
        )}
      </div>

      <Link
        href={`/rappels/${reminder.id}`}
        className="flex flex-1 flex-col gap-1 min-w-0"
      >
        <p
          className={cn(
            "line-clamp-2 text-sm",
            isLow ? "text-muted-foreground" : "text-foreground",
            isUrgent && "font-medium",
          )}
        >
          {reminder.message}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>
            <LocalTime iso={reminder.scheduled_at} />
          </span>
          {reminder.category && (
            <>
              <span aria-hidden>·</span>
              <span className="uppercase tracking-wider">
                {reminder.category}
              </span>
            </>
          )}
          {isShared && (
            <>
              <span aria-hidden>·</span>
              <span className="rounded-md bg-accent/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
                {creatorName ? `par ${creatorName}` : "Commun"}
              </span>
            </>
          )}
          {recurrenceLabel && (
            <>
              <span aria-hidden>·</span>
              <span>↻ {recurrenceLabel}</span>
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
        <div className="flex items-center gap-0.5 pt-0.5">
          <Link
            href={`/rappels/${reminder.id}`}
            aria-label="Modifier"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            )}
          >
            <Pencil size={16} />
          </Link>
          <InlineDeleteReminder id={reminder.id} />
        </div>
      )}
    </div>
  );
}
