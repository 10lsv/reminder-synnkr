import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { fr } from "date-fns/locale";

export type Preset = "1h" | "ce-soir" | "demain-8h" | "demain-18h";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toDate(input: Date | string): Date {
  return typeof input === "string" ? new Date(input) : input;
}

export function formatRelative(input: Date | string): string {
  const date = toDate(input);
  const now = new Date();
  const diffMin = differenceInMinutes(date, now);
  const diffHrs = differenceInHours(date, now);
  const diffDays = differenceInCalendarDays(date, now);
  const time = format(date, "HH:mm");

  if (diffMin > 0) {
    if (diffMin < 60) return `Dans ${diffMin} min`;
    if (isToday(date)) return `Aujourd'hui à ${time}`;
    if (isTomorrow(date)) return `Demain à ${time}`;
    if (diffDays < 7) {
      return `${capitalize(format(date, "EEEE", { locale: fr }))} à ${time}`;
    }
    return `Le ${format(date, "d MMM", { locale: fr })} à ${time}`;
  }

  const absMin = Math.abs(diffMin);
  const absHrs = Math.abs(diffHrs);
  if (absMin < 60) return `Il y a ${absMin} min`;
  if (isToday(date)) return `Il y a ${absHrs} h`;
  if (isYesterday(date)) return `Hier à ${time}`;
  return `Le ${format(date, "d MMM", { locale: fr })} à ${time}`;
}

export function formatExact(input: Date | string): string {
  return format(toDate(input), "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatDateLong(input: Date | string): string {
  return capitalize(format(toDate(input), "EEEE d MMMM", { locale: fr }));
}

// Brutalist date stamp: 18.05.26 / LUN
export function formatDateStamp(input: Date | string): string {
  const date = toDate(input);
  const day = format(date, "EEE", { locale: fr }).slice(0, 3).toUpperCase();
  const cleanDay = day.replace(/\.$/, "");
  return `${format(date, "dd.MM.yy")} / ${cleanDay}`;
}

export function formatTime(input: Date | string): string {
  return format(toDate(input), "HH:mm");
}

export function formatPreview(input: Date | string): string {
  return capitalize(
    format(toDate(input), "EEEE d MMMM 'à' HH:mm", { locale: fr }),
  );
}

export function toLocalDatetimeInputValue(input: Date | string): string {
  const date = toDate(input);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function getPresetDate(preset: Preset): Date {
  const d = new Date();
  switch (preset) {
    case "1h":
      d.setHours(d.getHours() + 1, d.getMinutes(), 0, 0);
      return d;
    case "ce-soir":
      // Pas de roll-over : si déjà passé 20h, la date retournée est passée.
      // Le chip UI est désactivé dans ce cas pour ne pas tromper l'utilisateur.
      d.setHours(20, 0, 0, 0);
      return d;
    case "demain-8h":
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    case "demain-18h":
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      return d;
  }
}

export function isSameDateTime(
  a: Date,
  b: Date,
  toleranceMs: number = 60_000,
): boolean {
  return Math.abs(a.getTime() - b.getTime()) <= toleranceMs;
}
