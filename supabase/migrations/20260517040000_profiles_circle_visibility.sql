-- Autoriser un user à lire le profil de son partenaire de cercle.
--
-- Le brief original ne permettait que `auth.uid() = id` sur profiles
-- (un user ne voit que lui). Pour que la case à cocher affiche le nom du
-- partenaire, on doit pouvoir lire son display_name.
--
-- Helper SECURITY DEFINER pour bypasser proprement la RLS récursive
-- (la policy sur profiles ne peut pas faire une sous-requête select sur
-- profiles sans risque de récursion).

create or replace function public.current_user_circle_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select circle_id from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_user_circle_id() to authenticated;

drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users read own or circle profile" on public.profiles;

create policy "users read own or circle profile" on public.profiles for select
  using (
    auth.uid() = id
    OR (
      circle_id is not null
      AND circle_id = public.current_user_circle_id()
    )
  );
