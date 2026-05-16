"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { markAsDone, snoozeReminder } from "@/app/actions/reminders";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const SNOOZE_MIN_CHARS = 10;
const SNOOZE_MAX_CHARS = 500;

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

  const trimmedLength = reason.trim().length;
  const remaining = SNOOZE_MIN_CHARS - trimmedLength;
  const tooShort = remaining > 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
    </div>
  );
}
