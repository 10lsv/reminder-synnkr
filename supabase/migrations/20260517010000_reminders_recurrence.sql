-- v1.1 — récurrence simple (none/daily/weekly/monthly).
-- Chaque rappel porte sa propre valeur recurrence. À chaque déclenchement,
-- l'Edge Function send-due-reminders insère la prochaine occurrence
-- (scheduled_at + intervalle correspondant) tant que recurrence != 'none'.

alter table public.reminders
  add column if not exists recurrence text not null default 'none';

alter table public.reminders
  drop constraint if exists reminders_recurrence_check;

alter table public.reminders
  add constraint reminders_recurrence_check
    check (recurrence in ('none', 'daily', 'weekly', 'monthly'));
