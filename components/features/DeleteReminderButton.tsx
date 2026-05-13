"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteReminder } from "@/app/actions/reminders";
import { Button } from "@/components/ui/Button";

export function DeleteReminderButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="danger"
        onClick={() => setConfirming(true)}
      >
        Supprimer
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Annuler
      </Button>
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteReminder(id);
          })
        }
      >
        {pending ? "Suppression…" : "Confirmer la suppression"}
      </Button>
    </div>
  );
}
