import { AlertCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { InlineDeleteReminder } from "@/components/features/InlineDeleteReminder";
import { LocalTime } from "@/components/features/LocalTime";
import { modelColorClasses, toModelColor } from "@/lib/models";
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
  // Map id → model (utile pour résoudre reminder.model_id).
  modelById?: Map<string, { name: string; color: string | null }>;
  // Map user_id → display_name (pour résoudre reminder.assigned_to).
  userNameById?: Map<string, string>;
  // L'id du user connecté — sert à savoir si l'assignee = moi/lui.
  currentUserId?: string;
}

function initialOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

export function ReminderListItem({
  reminder,
  showActions = true,
  partnerName = null,
  modelById,
  userNameById,
  currentUserId,
}: ReminderListItemProps) {
  const statusLabel = statusLabels[reminder.status];
  const recurrenceLabel =
    reminder.recurrence !== "none"
      ? recurrenceLabels[reminder.recurrence as "daily" | "weekly" | "monthly"]
      : undefined;
  const model = reminder.model_id
    ? modelById?.get(reminder.model_id)
    : undefined;
  const modelColor = model ? toModelColor(model.color) : null;
  const isUrgent = reminder.priority === "urgent";
  const isLow = reminder.priority === "low";

  // Assignee badge — uniquement pour les rappels communs avec assignation
  // explicite (un user ciblé). Pour "nous deux" (assigned_to null), pas de
  // badge pour ne pas surcharger.
  const assigneeName =
    reminder.circle_id && reminder.assigned_to
      ? userNameById?.get(reminder.assigned_to)
      : undefined;
  const assigneeIsMe = reminder.assigned_to === currentUserId;

  return (
    <div className="flex items-start gap-2 border-b border-border/60 py-3 last:border-b-0">
      {/* Pastille model couleur, ou indicator urgent */}
      <div className="flex flex-col items-center gap-2 pt-1.5">
        {modelColor ? (
          <span
            className={cn("size-2.5 rounded-full", modelColorClasses[modelColor].dot)}
            aria-label={`Model : ${model?.name}`}
          />
        ) : isUrgent ? (
          <AlertCircle
            className="size-3.5 text-destructive"
            aria-label="Urgent"
          />
        ) : (
          <span className="size-2.5 rounded-full bg-muted" aria-hidden />
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
          {model && modelColor && (
            <>
              <span aria-hidden>·</span>
              <span className="text-foreground">{model.name}</span>
            </>
          )}
          {assigneeName && (
            <>
              <span aria-hidden>·</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  assigneeIsMe
                    ? "bg-foreground text-background"
                    : "bg-accent text-accent-foreground",
                )}
              >
                {assigneeName}
              </span>
            </>
          )}
          {reminder.circle_id && !assigneeName && partnerName && (
            <>
              <span aria-hidden>·</span>
              <span className="rounded-md bg-accent/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
                Commun
              </span>
            </>
          )}
          {reminder.category && (
            <>
              <span aria-hidden>·</span>
              <span className="uppercase tracking-wider">
                {reminder.category}
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
