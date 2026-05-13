"use client";

import { useActionState, useState } from "react";
import type { ReminderFormState } from "@/app/actions/reminders";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  formatPreview,
  getPresetDate,
  isSameDateTime,
  toLocalDatetimeInputValue,
  type Preset,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

interface ReminderFormProps {
  action: (
    prevState: ReminderFormState,
    formData: FormData,
  ) => Promise<ReminderFormState>;
  initialData?: { message: string; scheduledAt: string };
  submitLabel?: string;
}

const initialState: ReminderFormState = { error: null };
const MAX = 500;

type Selection = Preset | "custom";

type Chip =
  | { kind: "preset"; value: Preset; label: string }
  | { kind: "custom"; label: string };

const chips: Chip[] = [
  { kind: "preset", value: "1h", label: "Dans 1h" },
  { kind: "preset", value: "ce-soir", label: "Ce soir 20h" },
  { kind: "preset", value: "demain-8h", label: "Demain 8h" },
  { kind: "preset", value: "demain-18h", label: "Demain 18h" },
  { kind: "custom", label: "Personnalisé" },
];

function detectPresetFromDate(date: Date): Preset | null {
  for (const chip of chips) {
    if (chip.kind !== "preset") continue;
    const presetDate = getPresetDate(chip.value);
    if (chip.value === "ce-soir" && presetDate.getTime() <= Date.now()) {
      continue;
    }
    if (isSameDateTime(presetDate, date)) return chip.value;
  }
  return null;
}

export function ReminderForm({
  action,
  initialData,
  submitLabel = "Programmer",
}: ReminderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [message, setMessage] = useState(initialData?.message ?? "");
  const [selection, setSelection] = useState<Selection>(() => {
    if (initialData) {
      const initDate = new Date(initialData.scheduledAt);
      return detectPresetFromDate(initDate) ?? "custom";
    }
    return "1h";
  });
  const [datetimeValue, setDatetimeValue] = useState<string>(() => {
    if (initialData) return initialData.scheduledAt;
    return toLocalDatetimeInputValue(getPresetDate("1h"));
  });

  const ceSoirAvailable = new Date().getHours() < 20;

  const onChipClick = (chip: Chip) => {
    if (chip.kind === "custom") {
      setSelection("custom");
      return;
    }
    if (chip.value === "ce-soir" && !ceSoirAvailable) return;
    setSelection(chip.value);
    setDatetimeValue(toLocalDatetimeInputValue(getPresetDate(chip.value)));
  };

  const onDatetimeChange = (v: string) => {
    setDatetimeValue(v);
    setSelection("custom");
  };

  const previewDate =
    selection !== "custom" && datetimeValue ? new Date(datetimeValue) : null;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Textarea
          name="message"
          label="Ton message"
          placeholder="Léo, t'avais promis..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX}
          required
          autoFocus
          rows={5}
        />
        <span className="self-end text-xs text-fg-tertiary tabular-nums">
          {message.length}/{MAX}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-fg">
          Quand t&apos;envoyer ça ?
        </span>

        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active =
              chip.kind === "preset"
                ? selection === chip.value
                : selection === "custom";
            const disabled =
              chip.kind === "preset" &&
              chip.value === "ce-soir" &&
              !ceSoirAvailable;
            return (
              <button
                key={chip.kind === "preset" ? chip.value : "custom"}
                type="button"
                onClick={() => onChipClick(chip)}
                disabled={disabled}
                aria-pressed={active}
                className={cn(
                  "rounded-pill border px-[14px] py-2 text-sm cursor-pointer touch-manipulation",
                  "transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-fg bg-fg text-bg"
                    : "border-border bg-transparent text-fg hover:border-fg-secondary",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {previewDate && (
          <p className="text-sm italic text-fg-tertiary">
            → {formatPreview(previewDate)}
          </p>
        )}

        {selection === "custom" && (
          <Input
            type="datetime-local"
            value={datetimeValue}
            onChange={(e) => onDatetimeChange(e.target.value)}
            required
            aria-label="Date et heure personnalisées"
          />
        )}

        <input type="hidden" name="scheduledAt" value={datetimeValue} />
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Envoi…" : submitLabel}
      </Button>

      {state.error && (
        <p role="alert" className="text-center text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
