"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { markAsDone, snoozeReminder } from "@/app/actions/reminders";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

const SNOOZE_MIN_CHARS = 10;
const SNOOZE_MAX_CHARS = 500;

type SnoozeOptionValue = "10" | "30" | "60" | "tomorrow";

const snoozeOptions: { value: SnoozeOptionValue; label: string }[] = [
  { value: "10", label: "+10m" },
  { value: "30", label: "+30m" },
  { value: "60", label: "+1h" },
  { value: "tomorrow", label: "Demain 8h" },
];

function computeSnoozeUntilIso(option: SnoozeOptionValue): string {
  const d = new Date();
  if (option === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
  } else {
    d.setMinutes(d.getMinutes() + Number.parseInt(option, 10));
  }
  return d.toISOString();
}

function DoneSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" fullWidth size="lg" disabled={pending}>
      {pending ? "…" : "✓ Fait"}
    </Button>
  );
}

function ConfirmSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      fullWidth
      size="lg"
      disabled={disabled || pending}
    >
      {pending ? "…" : "Confirmer →"}
    </Button>
  );
}

const SNOOZE_CHIP =
  "shrink-0 border px-3 py-1.5 cursor-pointer touch-manipulation transition-colors font-mono text-[10px] uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

function SnoozeForm({ id, onCancel }: { id: string; onCancel: () => void }) {
  const boundAction = snoozeReminder.bind(null, id);
  const [state, formAction] = useActionState(boundAction, { error: null });
  const [reason, setReason] = useState("");
  const [option, setOption] = useState<SnoozeOptionValue>("10");

  const trimmedLength = reason.trim().length;
  const remaining = SNOOZE_MIN_CHARS - trimmedLength;
  const tooShort = remaining > 0;

  const snoozeUntilIso = useMemo(() => computeSnoozeUntilIso(option), [option]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="label-mono">Repousser de</p>
        <div className="flex flex-wrap gap-1.5">
          {snoozeOptions.map((opt) => {
            const active = option === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOption(opt.value)}
                aria-pressed={active}
                className={cn(
                  SNOOZE_CHIP,
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Textarea
        name="reason"
        autoFocus
        rows={3}
        label="Excuse"
        placeholder="Pourquoi pas maintenant ?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={SNOOZE_MAX_CHARS}
        error={state.error ?? undefined}
        required
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {tooShort
          ? `Encore ${remaining} car. min`
          : `${trimmedLength}/${SNOOZE_MAX_CHARS}`}
      </p>

      <input type="hidden" name="snoozeUntil" value={snoozeUntilIso} />

      <div className="flex flex-col gap-2">
        <ConfirmSubmit disabled={tooShort} />
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground hover:underline"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

export function ActiveReminderActions({ id }: { id: string }) {
  const [snoozing, setSnoozing] = useState(false);

  if (snoozing) {
    return <SnoozeForm id={id} onCancel={() => setSnoozing(false)} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={markAsDone.bind(null, id)}>
        <DoneSubmit />
      </form>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
        <button
          type="button"
          onClick={() => setSnoozing(true)}
          className="cursor-pointer text-muted-foreground hover:text-foreground hover:underline"
        >
          Plus tard
        </button>
        <Link
          href={`/rappels/${id}`}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          Modifier →
        </Link>
      </div>
    </div>
  );
}
