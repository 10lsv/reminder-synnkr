-- v1.1 — catégorisation libre des rappels.
-- Free text, optionnel, max 30 caractères. Pas de table séparée : on garde
-- le schéma plat et on filtrera/dédupliquera en applicatif si besoin.

alter table public.reminders
  add column if not exists category text;

alter table public.reminders
  drop constraint if exists reminders_category_length_check;

alter table public.reminders
  add constraint reminders_category_length_check
    check (category is null or char_length(category) <= 30);
