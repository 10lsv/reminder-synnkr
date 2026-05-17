-- Phase OFM-A : entités "model" (talent OF) + priorité + assignation.
--
-- Une "model" vit dans un cercle (visible par les deux owners). owner_user_id
-- = celui qui s'en occupe principalement (utilisé comme assignee par défaut
-- sur les rappels rattachés). Status active/paused/dropped pour archiver
-- sans perdre l'historique.
--
-- reminder.model_id (nullable) — un rappel peut être rattaché à 0 ou 1 model.
-- reminder.priority — urgent / normal / low.
-- reminder.assigned_to — sur un rappel commun, qui doit agir ?
--   null = nous deux (premier qui agit clôt)
--   user_id = uniquement cette personne (l'autre voit pour suivi)

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  color text,
  status text not null default 'active',
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.models
  drop constraint if exists models_status_check;
alter table public.models
  add constraint models_status_check
    check (status in ('active', 'paused', 'dropped'));

create index if not exists models_circle_idx on public.models(circle_id) where circle_id is not null;
create index if not exists models_status_idx on public.models(status);

alter table public.models enable row level security;

drop policy if exists "users read models" on public.models;
create policy "users read models" on public.models for select
  using (
    user_id = auth.uid()
    OR (
      circle_id is not null
      AND circle_id = public.current_user_circle_id()
    )
  );

drop policy if exists "users insert models" on public.models;
create policy "users insert models" on public.models for insert
  with check (user_id = auth.uid());

drop policy if exists "users update models" on public.models;
create policy "users update models" on public.models for update
  using (
    user_id = auth.uid()
    OR (
      circle_id is not null
      AND circle_id = public.current_user_circle_id()
    )
  );

drop policy if exists "users delete models" on public.models;
create policy "users delete models" on public.models for delete
  using (
    user_id = auth.uid()
    OR (
      circle_id is not null
      AND circle_id = public.current_user_circle_id()
    )
  );

-- Reminders : nouveaux champs.
alter table public.reminders
  add column if not exists model_id uuid references public.models(id) on delete set null,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists priority text not null default 'normal';

alter table public.reminders
  drop constraint if exists reminders_priority_check;
alter table public.reminders
  add constraint reminders_priority_check
    check (priority in ('urgent', 'normal', 'low'));

create index if not exists reminders_model_idx on public.reminders(model_id) where model_id is not null;
create index if not exists reminders_assigned_idx on public.reminders(assigned_to) where assigned_to is not null;
create index if not exists reminders_priority_idx on public.reminders(priority) where priority != 'normal';
