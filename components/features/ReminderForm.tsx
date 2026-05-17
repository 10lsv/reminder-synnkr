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
  };
  hasCircle?: boolean;
  submitLabel?: string;
}

const scopeChips: { value: Scope; label: string }[] = [
  { value: "personal", label: "Perso" },
  { value: "shared", label: "Commun" },
];

const CATEGORY_MAX = 30;

const recurrenceChips: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Ponctuel" },
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdo" },
  { value: "monthly", label: "Mensuel" },
];

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
  hasCircle = false,
  submitLabel = "Programmer",
}: ReminderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [message, setMessage] = useState(initialData?.message ?? "");
  // État initial stable (sans Date.now()) pour que le rendu serveur == client.
  // Les valeurs dépendantes du temps sont fixées dans le useEffect ci-dessous.
  const [selection, setSelection] = useState<Selection>(
    initialData ? "custom" : "1h",
  );
  // SSR-stable : init vide pour éviter d'embarquer une valeur dépendant de la
  // TZ serveur. Le useEffect ci-dessous fixe la valeur en TZ navigateur.
  const [datetimeValue, setDatetimeValue] = useState<string>("");
  const [ceSoirAvailable, setCeSoirAvailable] = useState(true);
  const [recurrence, setRecurrence] = useState<Recurrence>(
    initialData?.recurrence ?? "none",
  );
  const [category, setCategory] = useState<string>(initialData?.category ?? "");
  const [scope, setScope] = useState<Scope>(initialData?.scope ?? "personal");

  const initialScheduledAtIso = initialData?.scheduledAt ?? null;
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

        {/*
          datetime-local renvoie une string sans TZ. Si on l'envoie brute, le
          serveur la parse dans SA timezone (UTC sur Vercel) — décalage de
          plusieurs heures pour l'utilisateur. On la convertit donc en ISO
          côté client, où new Date(...) utilise la TZ du navigateur.
        */}
        <input
          type="hidden"
          name="scheduledAt"
          value={
            datetimeValue ? new Date(datetimeValue).toISOString() : ""
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-fg">Répétition ?</span>
        <div className="flex flex-wrap gap-2">
          {recurrenceChips.map((chip) => {
            const active = recurrence === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setRecurrence(chip.value)}
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
                {chip.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="recurrence" value={recurrence} />
      </div>

      <div className="flex flex-col gap-2">
        <Input
          name="category"
          label="Catégorie (optionnel)"
          placeholder="Perso, Boulot, Cours…"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={CATEGORY_MAX}
        />
      </div>

      {hasCircle && (
        <div className="flex flex-col gap-3">
          <span className="text-base font-medium text-fg">Visibilité</span>
          <div className="flex flex-wrap gap-2">
            {scopeChips.map((chip) => {
              const active = scope === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setScope(chip.value)}
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
                  {chip.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="scope" value={scope} />
        </div>
      )}

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
