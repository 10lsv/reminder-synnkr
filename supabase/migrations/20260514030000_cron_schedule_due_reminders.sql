-- Schedule du job pg_cron qui appelle l'Edge Function send-due-reminders
-- chaque minute.
--
-- PRÉREQUIS (à faire dans cet ordre AVANT d'appliquer cette migration):
--   1. La migration 20260514020000_reminders_notified_at.sql doit être appliquée
--   2. L'Edge Function send-due-reminders doit être déployée
--      pnpm supabase functions deploy send-due-reminders
--   3. Les secrets de l'Edge Function doivent être set
--      pnpm supabase secrets set CRON_SECRET=<X> VAPID_SUBJECT=mailto:... \
--        VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
--   4. Le CRON_SECRET doit être stocké dans Vault sous le nom
--      'cron_secret_send_due_reminders' (avec la MÊME valeur qu'en 3):
--      select vault.create_secret('<le-meme-secret>', 'cron_secret_send_due_reminders');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Idempotent: enlève l'éventuel job pré-existant, puis re-schedule.
select cron.unschedule(jobid)
from cron.job
where jobname = 'send-due-reminders';

select cron.schedule(
  'send-due-reminders',
  '* * * * *',  -- chaque minute
  $$
  select net.http_post(
    url := 'https://xhszibfaqndtlmuilerh.functions.supabase.co/send-due-reminders',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret_send_due_reminders'
      ),
      'Content-Type',
      'application/json'
    ),
    timeout_milliseconds := 30000
  );
  $$
);
