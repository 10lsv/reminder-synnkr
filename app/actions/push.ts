"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import webpush from "web-push";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type PushActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function subscribePush(raw: unknown): Promise<PushActionResult> {
  const parsed = subscriptionSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      "[subscribePush] validation:",
      parsed.error.flatten().fieldErrors,
    );
    return { ok: false, error: "Subscription invalide." };
  }

  const { supabase, user } = await requireUser();
  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: userAgent,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.warn("[subscribePush] db:", error.message, error.code, error.hint);
    return {
      ok: false,
      error: `DB ${error.code ?? ""}: ${error.message}`.trim(),
    };
  }

  return { ok: true };
}

export async function unsubscribePush(
  endpoint: string,
): Promise<PushActionResult> {
  if (!endpoint) return { ok: false, error: "Endpoint manquant." };

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.warn("[unsubscribePush] db:", error.message);
    return { ok: false, error: "Impossible de désabonner." };
  }

  return { ok: true };
}

function configureWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function sendTestNotification(): Promise<{
  sent: number;
  failed: number;
}> {
  const { supabase, user } = await requireUser();

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) {
    console.warn("[sendTestNotification] db:", error.message);
    return { sent: 0, failed: 0 };
  }
  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  configureWebPush();

  const payload = JSON.stringify({
    title: "Test Reminder",
    body: "Si tu vois ça, le push fonctionne.",
    url: "/rappels",
  });

  let sent = 0;
  let failed = 0;
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
    } catch (err) {
      console.warn(
        "[sendTestNotification] push error:",
        err instanceof Error ? err.message : err,
      );
      failed++;
    }
  }

  return { sent, failed };
}
