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
  // On n'affiche le badge "par X" que si je ne suis pas le créateur — la
  // pastille lavande indique déjà qu'il s'agit d'un rappel commun.
  const creatorName =
    isShared && !creatorIsMe
      ? userNameById?.get(reminder.user_id) ?? partnerName
      : null;

  return (
    <div
      className={cn(
        "group/item flex items-center gap-2.5 border-b border-border/60 py-2.5 last:border-b-0 transition-colors duration-150",
        "hover:bg-muted/40 -mx-2 px-2 rounded-md",
        isUrgent && "bg-destructive/10 my-1 border-transparent hover:bg-destructive/15",
        isDone && "bg-success/10 border-transparent hover:bg-success/15",
      )}
    >
      <div className="flex w-3 flex-col items-center">
        {isUrgent ? (
          <AlertCircle
            className="size-3.5 text-destructive"
            aria-label="Urgent"
          />
        ) : isShared ? (
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
        ) : (
          <span
            className={cn(
              "size-1.5 rounded-full",
              isLow ? "bg-muted" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
        )}
      </div>

      <Link
        href={`/rappels/${reminder.id}`}
        className="flex flex-1 flex-col gap-0.5 min-w-0 transition-transform duration-150 ease-out active:scale-[0.985] transform-gpu"
      >
        <p
          className={cn(
            "line-clamp-2 text-[14px] leading-snug",
            isLow ? "text-muted-foreground" : "text-foreground",
            isUrgent && "font-medium",
          )}
        >
          {reminder.message}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
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
          {creatorName && (
            <>
              <span aria-hidden>·</span>
              <span className="rounded bg-accent/40 px-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
                par {creatorName}
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
        <div className="flex items-center gap-0.5">
          <Link
            href={`/rappels/${reminder.id}`}
            aria-label="Modifier"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            )}
          >
            <Pencil size={14} />
          </Link>
          <InlineDeleteReminder id={reminder.id} />
        </div>
      )}
    </div>
  );
}
