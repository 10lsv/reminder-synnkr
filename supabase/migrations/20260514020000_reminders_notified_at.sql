-- Dedupe pour les pushs envoyés par le cron.
-- Une fois un rappel notifié, on remplit notified_at pour éviter de le
-- renvoyer toutes les minutes tant que l'user ne l'a pas marqué "done".

alter table public.reminders
  add column if not exists notified_at timestamptz;

-- Index partiel optimisé pour la query du cron:
-- select * where status='pending' and notified_at is null and scheduled_at <= now()
create index if not exists reminders_pending_due_idx
  on public.reminders (scheduled_at)
  where status = 'pending' and notified_at is null;
