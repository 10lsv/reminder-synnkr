-- v1.1 — partage de rappels entre associés via "cercles".
--
-- Modèle :
--  - circles : un groupe de N membres (v1 : 2 — toi + ton associé).
--  - profiles.circle_id : nullable. Pointer vers le cercle dont l'user fait
--    partie. v1 contrainte = 1 user ↔ 1 cercle max (modèle DB le supporte
--    naturellement vu que circle_id est un FK simple).
--  - reminders.circle_id : nullable.
--      - null → rappel perso (RLS classique : only owner).
--      - set → rappel commun, visible/modifiable par tous les membres du
--        cercle.
--  - circle_invites : tokens d'invitation, consommés à l'acceptation. La
--    fonction accept_circle_invite tourne en SECURITY DEFINER pour bypasser
--    la RLS sur la lookup par token (le token EST le secret).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists circle_id uuid references public.circles(id) on delete set null;

create table if not exists public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
create index if not exists circle_invites_circle_idx on public.circle_invites(circle_id);

alter table public.reminders
  add column if not exists circle_id uuid references public.circles(id) on delete set null;
create index if not exists reminders_circle_idx on public.reminders(circle_id) where circle_id is not null;

-- RLS sur circles : un user voit son cercle.
alter table public.circles enable row level security;
drop policy if exists "members read their circle" on public.circles;
create policy "members read their circle" on public.circles for select
  using (id = (select circle_id from public.profiles where id = auth.uid()));

drop policy if exists "creator inserts circle" on public.circles;
create policy "creator inserts circle" on public.circles for insert
  with check (created_by = auth.uid());

-- RLS sur circle_invites : seuls les membres voient/créent/suppriment les
-- invites de leur cercle (l'acceptation passe par la fonction security
-- definer, donc bypass).
alter table public.circle_invites enable row level security;
drop policy if exists "members read their invites" on public.circle_invites;
create policy "members read their invites" on public.circle_invites for select
  using (circle_id = (select circle_id from public.profiles where id = auth.uid()));

drop policy if exists "members create invites" on public.circle_invites;
create policy "members create invites" on public.circle_invites for insert
  with check (
    inviter_user_id = auth.uid()
    AND circle_id = (select circle_id from public.profiles where id = auth.uid())
  );

drop policy if exists "members delete their invites" on public.circle_invites;
create policy "members delete their invites" on public.circle_invites for delete
  using (circle_id = (select circle_id from public.profiles where id = auth.uid()));

-- RLS sur reminders : étendre l'ancienne policy "users crud own reminders"
-- pour autoriser les rappels du cercle.
drop policy if exists "users crud own reminders" on public.reminders;
drop policy if exists "users read own or circle reminders" on public.reminders;
drop policy if exists "users write own or circle reminders" on public.reminders;

create policy "users read own or circle reminders" on public.reminders for select
  using (
    user_id = auth.uid()
    OR (
      circle_id is not null
      AND circle_id = (select circle_id from public.profiles where id = auth.uid())
    )
  );

create policy "users insert own reminders" on public.reminders for insert
  with check (
    user_id = auth.uid()
    AND (
      circle_id is null
      OR circle_id = (select circle_id from public.profiles where id = auth.uid())
    )
  );

create policy "users update own or circle reminders" on public.reminders for update
  using (
    user_id = auth.uid()
    OR (
      circle_id is not null
      AND circle_id = (select circle_id from public.profiles where id = auth.uid())
    )
  );

create policy "users delete own or circle reminders" on public.reminders for delete
  using (
    user_id = auth.uid()
    OR (
      circle_id is not null
      AND circle_id = (select circle_id from public.profiles where id = auth.uid())
    )
  );

-- RLS snooze_reasons : visible/insertable si l'user owne ou si le rappel
-- est dans son cercle.
drop policy if exists "users crud own snooze reasons" on public.snooze_reasons;
drop policy if exists "users read snooze reasons" on public.snooze_reasons;

create policy "users read snooze reasons" on public.snooze_reasons for select
  using (
    user_id = auth.uid()
    OR exists (
      select 1 from public.reminders r
      where r.id = snooze_reasons.reminder_id
        AND r.circle_id is not null
        AND r.circle_id = (select circle_id from public.profiles where id = auth.uid())
    )
  );

create policy "users insert snooze reasons" on public.snooze_reasons for insert
  with check (
    user_id = auth.uid()
    AND exists (
      select 1 from public.reminders r
      where r.id = snooze_reasons.reminder_id
        AND (
          r.user_id = auth.uid()
          OR r.circle_id = (select circle_id from public.profiles where id = auth.uid())
        )
    )
  );

-- Fonction d'acceptation d'une invitation. Security definer pour permettre
-- au user non-membre de looker l'invite par token sans avoir besoin d'une
-- RLS permissive sur circle_invites.
create or replace function public.accept_circle_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite circle_invites%rowtype;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthenticated';
  end if;

  select * into v_invite
  from circle_invites
  where token = p_token AND expires_at > now()
  limit 1;

  if v_invite.id is null then
    raise exception 'invalid_or_expired_invite';
  end if;

  update profiles set circle_id = v_invite.circle_id where id = v_user_id;
  delete from circle_invites where id = v_invite.id;
  return v_invite.circle_id;
end;
$$;

grant execute on function public.accept_circle_invite(text) to authenticated;
