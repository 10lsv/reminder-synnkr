"use client";

import { useActionState, useEffect, useState } from "react";
import type { ReminderFormState } from "@/app/actions/reminders";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { modelColorClasses, toModelColor, type Model } from "@/lib/models";
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
type AssigneeChoice = "me" | "partner" | "both";

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
    modelId?: string | null;
    assignedTo?: string | null;
  };
  partner?: PartnerInfo | null;
  currentUserId: string;
  models?: Model[];
  existingCategories?: string[];
  submitLabel?: string;
}

const priorityChips: { value: Priority; label: string; className: string }[] = [
  {
    value: "urgent",
    label: "Urgent",
    className:
      "border-destructive/40 bg-destructive/10 text-destructive aria-pressed:bg-destructive aria-pressed:text-destructive-foreground aria-pressed:border-destructive",
  },
  {
    value: "normal",
    label: "Normal",
    className:
      "border-border text-foreground aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:border-foreground",
  },
  {
    value: "low",
    label: "Low",
    className:
      "border-border text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground aria-pressed:border-muted-foreground",
  },
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

function initialAssignee(
  scope: Scope,
  assignedTo: string | null | undefined,
  currentUserId: string,
  partnerId: string | undefined,
): AssigneeChoice {
  if (scope !== "shared") return "me";
  if (!assignedTo) return "both";
  if (assignedTo === currentUserId) return "me";
  if (partnerId && assignedTo === partnerId) return "partner";
  return "both";
}

function resolveAssignedToId(
  choice: AssigneeChoice,
  currentUserId: string,
  partnerId: string | undefined,
): string | null {
  if (choice === "me") return currentUserId;
  if (choice === "partner" && partnerId) return partnerId;
  return null;
}

export function ReminderForm({
  action,
  initialData,
  partner = null,
  currentUserId,
  models = [],
  existingCategories = [],
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
  const [priority, setPriority] = useState<Priority>(
    initialData?.priority ?? "normal",
  );
  const [modelId, setModelId] = useState<string>(initialData?.modelId ?? "");
  const [assignee, setAssignee] = useState<AssigneeChoice>(() =>
    initialAssignee(
      initialData?.scope ?? "personal",
      initialData?.assignedTo,
      currentUserId,
      partner?.id,
    ),
  );

  const partnerName = partner?.name ?? null;
  const assignedToId = resolveAssignedToId(assignee, currentUserId, partner?.id);

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
        <span className="self-end text-xs text-muted-foreground tabular-nums">
          {message.length}/{MAX}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-foreground">
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
                  "rounded-full border px-[14px] py-2 text-sm cursor-pointer touch-manipulation",
                  "transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-foreground hover:border-muted-foreground",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {previewDate && (
          <p className="text-sm italic text-muted-foreground">
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
        <span className="text-base font-medium text-foreground">Répétition ?</span>
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
                  "rounded-full border px-[14px] py-2 text-sm cursor-pointer touch-manipulation",
                  "transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-foreground hover:border-muted-foreground",
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
        {existingCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingCategories.map((c) => {
              const active =
                category.trim().toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(active ? "" : c)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs uppercase tracking-wider cursor-pointer touch-manipulation",
                    "transition-colors duration-150 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {models.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Model</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModelId("")}
              aria-pressed={modelId === ""}
              className={cn(
                "rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors",
                modelId === ""
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground",
              )}
            >
              Aucune
            </button>
            {models.map((m) => {
              const color = toModelColor(m.color);
              const cls = modelColorClasses[color];
              const active = modelId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModelId(m.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : `${cls.chip} hover:opacity-80`,
                  )}
                >
                  <span className={cn("size-2 rounded-full", cls.dot)} />
                  {m.name}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="modelId" value={modelId} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Priorité</span>
        <div className="flex flex-wrap gap-2">
          {priorityChips.map((chip) => {
            const active = priority === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setPriority(chip.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors",
                  chip.className,
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="priority" value={priority} />
      </div>

      {partnerName && (
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-3 text-base text-foreground">
            <input
              type="checkbox"
              checked={scope === "shared"}
              onChange={(e) =>
                setScope(e.target.checked ? "shared" : "personal")
              }
              className="size-4 cursor-pointer accent-foreground"
            />
            <span>Partager avec {partnerName}</span>
          </label>
          <input type="hidden" name="scope" value={scope} />

          {scope === "shared" && (
            <div className="flex flex-col gap-2 pl-7">
              <span className="text-xs text-muted-foreground">Pour qui ?</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "me", label: "Toi" },
                    { value: "partner", label: partnerName },
                    { value: "both", label: "Nous deux" },
                  ] as const
                ).map((opt) => {
                  const active = assignee === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAssignee(opt.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-transparent text-foreground hover:border-muted-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <input type="hidden" name="assignedTo" value={assignedToId ?? ""} />
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Envoi…" : submitLabel}
      </Button>

      {state.error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
