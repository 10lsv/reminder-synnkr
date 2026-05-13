-- Ajoute la contrainte unique (user_id, endpoint) si elle manque.
-- Sans cette contrainte, l'upsert avec onConflict côté Server Action
-- échoue avec Postgres 42P10 (no matching constraint).
-- Idempotent : ne fait rien si la contrainte existe déjà.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.push_subscriptions'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%(user_id, endpoint)%'
  ) then
    alter table public.push_subscriptions
      add constraint push_subscriptions_user_id_endpoint_key
      unique (user_id, endpoint);
    raise notice 'Contrainte unique (user_id, endpoint) ajoutée';
  else
    raise notice 'Contrainte unique (user_id, endpoint) existe déjà';
  end if;
end $$;
