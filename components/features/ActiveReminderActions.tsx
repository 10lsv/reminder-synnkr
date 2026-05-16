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
  { value: "10", label: "10 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1h" },
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
    <Button type="submit" variant="primary" fullWidth disabled={pending}>
      {pending ? "Enregistrement…" : "Fait"}
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
      disabled={disabled || pending}
    >
      {pending ? "Enregistrement…" : "Confirmer"}
    </Button>
  );
}

function SnoozeForm({ id, onCancel }: { id: string; onCancel: () => void }) {
  const boundAction = snoozeReminder.bind(null, id);
  const [state, formAction] = useActionState(boundAction, { error: null });
  const [reason, setReason] = useState("");
  const [option, setOption] = useState<SnoozeOptionValue>("10");

  const trimmedLength = reason.trim().length;
  const remaining = SNOOZE_MIN_CHARS - trimmedLength;
  const tooShort = remaining > 0;

  // ISO calculé dans la TZ du navigateur — important pour "Demain 8h"
  // (un user à Paris veut 8h Paris, pas 8h UTC).
  const snoozeUntilIso = useMemo(() => computeSnoozeUntilIso(option), [option]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-fg-secondary">Repousser de…</p>
        <div className="flex flex-wrap gap-2">
          {snoozeOptions.map((opt) => {
            const active = option === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOption(opt.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-pill border px-[14px] py-2 text-sm cursor-pointer touch-manipulation",
                  "transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
                  active
                    ? "border-fg bg-fg text-bg"
                    : "border-border bg-transparent text-fg hover:border-fg-secondary",
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
        rows={4}
        placeholder="Pourquoi pas maintenant ?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={SNOOZE_MAX_CHARS}
        error={state.error ?? undefined}
        required
      />
      <p className="text-sm text-fg-tertiary">
        {tooShort
          ? `Encore ${remaining} caractère${remaining > 1 ? "s" : ""} minimum`
          : `${trimmedLength}/${SNOOZE_MAX_CHARS}`}
      </p>

      <input type="hidden" name="snoozeUntil" value={snoozeUntilIso} />

      <ConfirmSubmit disabled={tooShort} />
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer text-sm text-fg-secondary underline-offset-4 hover:underline"
      >
        Annuler
      </button>
    </form>
  );
}

export function ActiveReminderActions({ id }: { id: string }) {
  const [snoozing, setSnoozing] = useState(false);

  if (snoozing) {
    return <SnoozeForm id={id} onCancel={() => setSnoozing(false)} />;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <form action={markAsDone.bind(null, id)} className="w-full">
        <DoneSubmit />
      </form>
      <button
        type="button"
        onClick={() => setSnoozing(true)}
        className="cursor-pointer text-base text-fg-secondary underline-offset-4 hover:underline"
      >
        Plus tard
      </button>
      <Link
        href={`/rappels/${id}`}
        className="text-sm text-fg-tertiary underline-offset-4 hover:underline"
      >
        Modifier
      </Link>
    </div>
  );
}
