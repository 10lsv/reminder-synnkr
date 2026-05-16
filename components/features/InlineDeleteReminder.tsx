"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { deleteReminder } from "@/app/actions/reminders";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  label?: string;
}

export function InlineDeleteReminder({ id, label = "Supprimer" }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  // Auto-collapse l'état "confirming" après 5s d'inactivité (cohérent avec
  // DeleteReminderButton sur la page d'édition).
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => setConfirming(true)}
        className={cn(
          "flex h-9 w-9 cursor-pointer items-center justify-center rounded-pill",
          "text-fg-secondary hover:text-danger transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
        )}
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="cursor-pointer text-sm text-fg-secondary underline-offset-4 hover:underline"
      >
        Annuler
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteReminder(id);
          })
        }
        className="cursor-pointer text-sm text-danger underline-offset-4 hover:underline"
      >
        {pending ? "…" : "Confirmer"}
      </button>
    </div>
  );
}
