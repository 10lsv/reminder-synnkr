<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Test iPhone : NE PAS utiliser `pnpm dev`

Sur iOS Safari accédé via LAN (`http://192.168.x.x:3000`), le WebSocket HMR de Turbopack échoue avec `cannot parse response`. L'erreur n'apparaît qu'en mode dev, et empêche l'hydration React de se compléter : la page s'affiche, les `<form action>` natifs marchent, mais **tous les `onClick` sont morts**.

Pour tester sur iPhone :
- `pnpm build && pnpm start` (mode production, pas de HMR) — accès iPhone via `http://192.168.x.x:3000`
- ou Vercel preview deploy (URL HTTPS publique)

Pour itérer rapidement, utilise Mac/Chrome avec `pnpm dev`. iPhone uniquement quand tu veux valider.

## Variables d'environnement

Toutes dans `.env.local` (gitignored). Ne JAMAIS coller les valeurs dans le chat ou les commit.

| Variable | Usage | Phase | Public ? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase | 3 | oui (NEXT_PUBLIC) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé anon Supabase | 3 | oui (NEXT_PUBLIC) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID (subscribe push) | 5.3 | oui (NEXT_PUBLIC) |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID (signature push côté serveur) | 5.3 | **non, secret** |
| `VAPID_SUBJECT` | Identifiant subject VAPID, format `mailto:email` | 5.3 | non |
| `CRON_SECRET` | Secret partagé entre pg_cron et l'Edge Function | 5.6 | **non, secret** |

Pour générer une paire VAPID : `pnpm dlx web-push generate-vapid-keys`.
Pour générer un CRON_SECRET : `openssl rand -hex 32`.

Le `CRON_SECRET` est utilisé à 2 endroits, **avec la même valeur** :
- Secret de l'Edge Function `send-due-reminders` : `pnpm supabase secrets set CRON_SECRET=<x> ...`
- Vault Supabase, nom `cron_secret_send_due_reminders` : exécute dans le SQL Editor
  ```sql
  select vault.create_secret('<le-meme-secret>', 'cron_secret_send_due_reminders');
  ```
Le Next.js app ne lit pas `CRON_SECRET`, donc inutile dans `.env.local`/Vercel.

## Cron des rappels (Phase 5.6)

Le scheduler tourne dans Supabase :
- `pg_cron` exécute toutes les minutes : appelle l'Edge Function `send-due-reminders` via `pg_net`.
- L'Edge Function lit les `reminders` pending dont `scheduled_at <= now()` et `notified_at is null`, envoie un push à chaque sub du user via `web-push`, marque `notified_at`, nettoie les subs expirées (HTTP 404/410).
- Le cron est configuré dans `supabase/migrations/20260514030000_cron_schedule_due_reminders.sql`.

Pour voir l'historique des exécutions du cron :
```sql
select * from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'send-due-reminders')
order by start_time desc limit 20;
```

Pour voir les réponses HTTP de pg_net :
```sql
select * from net._http_response order by created desc limit 10;
```
