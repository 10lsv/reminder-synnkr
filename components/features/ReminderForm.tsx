"use client";

import { useActionState, useEffect, useState } from "react";
import type { ReminderFormState } from "@/app/actions/reminders";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Recurrence } from "@/lib/recurrence";
import {
  formatPreview,
  getPresetDate,
  isSameDateTime,
  toLocalDatetimeInputValue,
  type Preset,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

type Scope = "personal" | "shared";
type Priority = "urgent" | "normal" | "low";

interface PartnerInfo {
  id: string;
  name: string;
}

interface ReminderFormProps {
  action: (
    prevState: ReminderFormState,
    formData: FormData,
  ) => Promise<ReminderFormState>;
  initialData?: {
    message: string;
    scheduledAt: string;
    recurrence?: Recurrence;
    category?: string | null;
    scope?: Scope;
    priority?: Priority;
  };
  partner?: PartnerInfo | null;
  existingCategories?: string[];
  submitLabel?: string;
}

const priorityChips: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_MAX = 30;

const recurrenceChips: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const initialState: ReminderFormState = { error: null };
const MAX = 500;

type Selection = Preset | "custom";

type Chip =
  | { kind: "preset"; value: Preset; label: string }
  | { kind: "custom"; label: string };

const chips: Chip[] = [
  { kind: "preset", value: "1h", label: "+1h" },
  { kind: "preset", value: "ce-soir", label: "20h" },
  { kind: "preset", value: "demain-8h", label: "Demain 8h" },
  { kind: "preset", value: "demain-18h", label: "Demain 18h" },
  { kind: "custom", label: "Custom" },
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

const CHIP_BASE =
  "shrink-0 border px-3 py-1.5 cursor-pointer touch-manipulation transition-colors font-mono text-[10px] uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-40";
const CHIP_ON = "border-foreground bg-foreground text-background";
const CHIP_OFF =
  "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground";

export function ReminderForm({
  action,
  initialData,
  partner = null,
  existingCategories = [],
  submitLabel = "Programmer →",
}: ReminderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [message, setMessage] = useState(initialData?.message ?? "");
  const [selection, setSelection] = useState<Selection>(
    initialData ? "custom" : "1h",
  );
  const [datetimeValue, setDatetimeValue] = useState<string>("");
  const [ceSoirAvailable, setCeSoirAvailable] = useState(true);
  const [recurrence, setRecurrence] = useState<Recurrence>(
    initialData?.recurrence ?? "none",
  );
  const [category, setCategory] = useState<string>(initialData?.category ?? "");
  const [scope, setScope] = useState<Scope>(initialData?.scope ?? "personal");
  const [priority, setPriority] = useState<Priority>(
    initialData?.priority ?? "normal",
  );

  const partnerName = partner?.name ?? null;

  const initialScheduledAtIso = initialData?.scheduledAt ?? null;
  // Hydratation depuis l'horloge/TZ du navigateur — impossible en SSR sans mismatch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (initialScheduledAtIso) {
      const d = new Date(initialScheduledAtIso);
      setDatetimeValue(toLocalDatetimeInputValue(d));
      const detected = detectPresetFromDate(d);
      if (detected) setSelection(detected);
    } else {
      setDatetimeValue(toLocalDatetimeInputValue(getPresetDate("1h")));
    }
    setCeSoirAvailable(new Date().getHours() < 20);
  }, [initialScheduledAtIso]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Textarea
          name="message"
          label="Message"
          placeholder="Léo, t'avais promis…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX}
          required
          autoFocus
          rows={4}
        />
        <span className="self-end font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
          {message.length}/{MAX}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="label-mono">Quand</span>
        <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
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
                className={cn(CHIP_BASE, active ? CHIP_ON : CHIP_OFF)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {previewDate && (
          <p className="font-mono text-[11px] italic text-muted-foreground">
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

        <input
          type="hidden"
          name="scheduledAt"
          value={datetimeValue ? new Date(datetimeValue).toISOString() : ""}
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="label-mono">Répétition</span>
        <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
          {recurrenceChips.map((chip) => {
            const active = recurrence === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setRecurrence(chip.value)}
                aria-pressed={active}
                className={cn(CHIP_BASE, active ? CHIP_ON : CHIP_OFF)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="recurrence" value={recurrence} />
      </div>

      <div className="flex flex-col gap-3">
        <span className="label-mono">Priorité</span>
        <div className="grid grid-cols-3 gap-1.5">
          {priorityChips.map((chip) => {
            const active = priority === chip.value;
            const isUrgent = chip.value === "urgent";
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setPriority(chip.value)}
                aria-pressed={active}
                className={cn(
                  CHIP_BASE,
                  "justify-center",
                  active
                    ? isUrgent
                      ? "border-destructive bg-destructive text-background"
                      : CHIP_ON
                    : CHIP_OFF,
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="priority" value={priority} />
      </div>

      <div className="flex flex-col gap-3">
        <Input
          name="category"
          label="Catégorie (optionnel)"
          placeholder="Sophie, Emma, admin…"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={CATEGORY_MAX}
        />
        {existingCategories.length > 0 && (
          <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
            {existingCategories.map((c) => {
              const active = category.trim().toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(active ? "" : c)}
                  aria-pressed={active}
                  className={cn(CHIP_BASE, active ? CHIP_ON : CHIP_OFF)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {partnerName && (
        <label className="flex cursor-pointer items-center gap-3 border border-border px-3 py-2.5 hover:border-foreground transition-colors">
          <input
            type="checkbox"
            checked={scope === "shared"}
            onChange={(e) =>
              setScope(e.target.checked ? "shared" : "personal")
            }
            className="size-4 cursor-pointer accent-foreground"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
            Partager avec {partnerName}
          </span>
          <input type="hidden" name="scope" value={scope} />
        </label>
      )}

      <Button type="submit" variant="primary" fullWidth size="lg" disabled={pending}>
        {pending ? "Envoi…" : submitLabel}
      </Button>

      {state.error && (
        <p role="alert" className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
