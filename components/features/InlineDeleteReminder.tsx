"use client";

import { X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { deleteReminder } from "@/app/actions/reminders";

interface Props {
  id: string;
  label?: string;
}

export function InlineDeleteReminder({ id, label = "Supprimer" }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

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
        className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <X size={16} strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="cursor-pointer text-muted-foreground hover:text-foreground"
      >
        Annul
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteReminder(id);
          })
        }
        className="cursor-pointer text-destructive hover:underline"
      >
        {pending ? "…" : "OK"}
      </button>
    </div>
  );
}
