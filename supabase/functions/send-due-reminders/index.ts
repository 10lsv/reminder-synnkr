// Edge Function appelée par pg_cron toutes les minutes.
// Trouve les rappels dus, envoie un push à chaque subscription du user,
// marque notified_at, nettoie les subs expirées (HTTP 404/410).
//
// Variables d'env nécessaires (via `supabase secrets set ...`):
// - CRON_SECRET           : secret partagé avec le job pg_cron
// - VAPID_SUBJECT         : mailto:...
// - VAPID_PUBLIC_KEY      : clé publique VAPID
// - VAPID_PRIVATE_KEY     : clé privée VAPID
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont auto-injectées par Supabase.

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("CRON_SECRET")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();

  const { data: due, error: selectErr } = await supabase
    .from("reminders")
    .select("id, user_id, message, scheduled_at")
    .eq("status", "pending")
    .is("notified_at", null)
    .lte("scheduled_at", now);

  if (selectErr) {
    console.error("[send-due-reminders] select reminders:", selectErr);
    return jsonResponse({ error: selectErr.message }, 500);
  }

  if (!due || due.length === 0) {
    return jsonResponse({ sent: 0, failed: 0, processed: 0 }, 200);
  }

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (const reminder of due) {
    const { data: subs, error: subErr } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", reminder.user_id);

    if (subErr) {
      console.error("[send-due-reminders] select subs:", subErr);
      failed++;
      continue;
    }

    // Aucun device subscribed : marque notified_at quand même pour ne pas
    // retenter en boucle.
    if (!subs || subs.length === 0) {
      await supabase
        .from("reminders")
        .update({ notified_at: now })
        .eq("id", reminder.id);
      continue;
    }

    const payload = JSON.stringify({
      title: "Reminder",
      body: reminder.message,
      url: `/rappels/${reminder.id}`,
      reminderId: reminder.id,
    });

    let anySent = false;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
        anySent = true;
      } catch (err) {
        failed++;
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 404 Not Found / 410 Gone = la sub est invalide, on la nettoie
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
        console.error(
          "[send-due-reminders] push error:",
          statusCode,
          err instanceof Error ? err.message : err,
        );
      }
    }

    if (anySent) {
      await supabase
        .from("reminders")
        .update({ notified_at: now })
        .eq("id", reminder.id);
    }
  }

  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return jsonResponse(
    {
      sent,
      failed,
      processed: due.length,
      expiredCleaned: expiredEndpoints.length,
    },
    200,
  );
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
