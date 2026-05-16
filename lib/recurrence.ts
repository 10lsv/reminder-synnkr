export const RECURRENCE_VALUES = [
  "none",
  "daily",
  "weekly",
  "monthly",
] as const;
export type Recurrence = (typeof RECURRENCE_VALUES)[number];

export const recurrenceLabels: Record<Exclude<Recurrence, "none">, string> = {
  daily: "Quotidien",
  weekly: "Hebdo",
  monthly: "Mensuel",
};
