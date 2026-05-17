"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RECURRENCE_VALUES } from "@/lib/recurrence";
import { createClient } from "@/lib/supabase/server";

const scheduledAtTransform = z
  .string()
  .min(1)
  .transform((v, ctx) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return d;
  });

const categoryTransform = z
  .string()
  .trim()
  .max(30)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

const scopeSchema = z.enum(["personal", "shared"]).default("personal");
const prioritySchema = z
  .enum(["urgent", "normal", "low"])
  .default("normal");

const createReminderSchema = z.object({
  message: z.string().trim().min(1).max(500),
  scheduledAt: scheduledAtTransform.refine(
    (d) => d.getTime() > Date.now(),
    { message: "Date passée" },
  ),
  recurrence: z.enum(RECURRENCE_VALUES).default("none"),
  category: categoryTransform,
  scope: scopeSchema,
  priority: prioritySchema,
});

const updateReminderSchema = z.object({
  message: z.string().trim().min(1).max(500),
  scheduledAt: scheduledAtTransform,
  recurrence: z.enum(RECURRENCE_VALUES).default("none"),
  category: categoryTransform,
  scope: scopeSchema,
  priority: prioritySchema,
});

// Normalise une catégorie : si le user a déjà utilisé "Cours" et qu'il
// re-tape "cours", on utilise EXACTEMENT le casing canonique pour éviter
// les doublons visuels dans les filtres et le combobox.
async function canonicalizeCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  raw: string | null,
): Promise<string | null> {
  if (!raw) return null;
  const target = raw.trim();
  if (!target) return null;
  const { data } = await supabase
    .from("reminders")
    .select("category")
    .ilike("category", target);
  for (const r of data ?? []) {
    if (r.category && r.category.toLowerCase() === target.toLowerCase()) {
      return r.category;
    }
  }
  return target;
}

async function resolveCircleId(
  scope: "personal" | "shared",
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  if (scope !== "shared") return null;
  const { data } = await supabase
    .from("profiles")
    .select("circle_id")
    .eq("id", userId)
    .maybeSingle();
  // Si l'user a coché "Commun" sans avoir de cercle (cas de course), on
  // dégrade en perso plutôt que de bloquer.
  return data?.circle_id ?? null;
}

export type ReminderFormState = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createReminder(
  _prev: ReminderFormState,
  formData: FormData,
): Promise<ReminderFormState> {
  const parsed = createReminderSchema.safeParse({
    message: formData.get("message"),
    scheduledAt: formData.get("scheduledAt"),
    recurrence: formData.get("recurrence") ?? "none",
    category: formData.get("category") ?? "",
    scope: formData.get("scope") ?? "personal",
    priority: formData.get("priority") ?? "normal",
  });
  if (!parsed.success) {
    console.warn(
      "[createReminder] validation:",
      parsed.error.flatten().fieldErrors,
    );
    return { error: "Vérifie ton message et la date." };
  }

  const { supabase, user } = await requireUser();
  const circleId = await resolveCircleId(parsed.data.scope, supabase, user.id);
  const canonicalCategory = await canonicalizeCategory(
    supabase,
    parsed.data.category,
  );
  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    message: parsed.data.message,
    scheduled_at: parsed.data.scheduledAt.toISOString(),
    recurrence: parsed.data.recurrence,
    category: canonicalCategory,
    circle_id: circleId,
    priority: parsed.data.priority,
  });
  if (error) {
    console.warn("[createReminder] db:", error.message);
    return { error: "Impossible de créer le rappel." };
  }

  revalidatePath("/", "layout");
  redirect("/rappels");
}

export async function updateReminder(
  id: string,
  _prev: ReminderFormState,
  formData: FormData,
): Promise<ReminderFormState> {
  const parsed = updateReminderSchema.safeParse({
    message: formData.get("message"),
    scheduledAt: formData.get("scheduledAt"),
    recurrence: formData.get("recurrence") ?? "none",
    category: formData.get("category") ?? "",
    scope: formData.get("scope") ?? "personal",
    priority: formData.get("priority") ?? "normal",
  });
  if (!parsed.success) {
    console.warn(
      "[updateReminder] validation:",
      parsed.error.flatten().fieldErrors,
    );
    return { error: "Vérifie ton message et la date." };
  }

  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("reminders")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    redirect("/rappels");
  }

  const circleId = await resolveCircleId(parsed.data.scope, supabase, user.id);
  const canonicalCategory = await canonicalizeCategory(
    supabase,
    parsed.data.category,
  );
  const { error } = await supabase
    .from("reminders")
    .update({
      message: parsed.data.message,
      scheduled_at: parsed.data.scheduledAt.toISOString(),
      recurrence: parsed.data.recurrence,
      category: canonicalCategory,
      circle_id: circleId,
      priority: parsed.data.priority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.warn("[updateReminder] db:", error.message);
    return { error: "Impossible de mettre à jour." };
  }

  revalidatePath("/", "layout");
  redirect("/rappels");
}

export async function deleteReminder(id: string): Promise<void> {
  const { supabase } = await requireUser();

  // RLS autorise le delete si l'user est créateur OU membre du même circle.
  // Pas de pré-check applicatif : on laisse RLS trancher.
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) {
    console.warn("[deleteReminder] db:", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/rappels");
}

export async function markAsDone(id: string): Promise<void> {
  const { supabase } = await requireUser();

  // RLS autorise l'update si l'user est créateur OU membre du même circle.
  const { error } = await supabase
    .from("reminders")
    .update({
      status: "done",
      done_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.warn("[markAsDone] db:", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

const SNOOZE_MIN_CHARS = 10;
const SNOOZE_MAX_CHARS = 500;
// Garde-fou serveur : la durée de snooze est calculée côté client (TZ
// utilisateur, pour "Demain 8h"), mais on borne entre 1 min et 7 jours
// pour éviter les valeurs aberrantes.
const SNOOZE_MIN_MS = 60 * 1000;
const SNOOZE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

const snoozeSchema = z.object({
  reason: z.string().trim().min(SNOOZE_MIN_CHARS).max(SNOOZE_MAX_CHARS),
  snoozeUntil: z
    .string()
    .min(1)
    .transform((v, ctx) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: "custom", message: "Date snooze invalide" });
        return z.NEVER;
      }
      const delta = d.getTime() - Date.now();
      if (delta < SNOOZE_MIN_MS || delta > SNOOZE_MAX_MS) {
        ctx.addIssue({ code: "custom", message: "Durée hors bornes" });
        return z.NEVER;
      }
      return d;
    }),
});

export type SnoozeFormState = { error: string | null };

export async function snoozeReminder(
  id: string,
  _prev: SnoozeFormState,
  formData: FormData,
): Promise<SnoozeFormState> {
  const parsed = snoozeSchema.safeParse({
    reason: formData.get("reason"),
    snoozeUntil: formData.get("snoozeUntil"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    if (flat.snoozeUntil?.length) {
      return { error: "Durée invalide." };
    }
    return {
      error: `Donne une raison d'au moins ${SNOOZE_MIN_CHARS} caractères.`,
    };
  }

  const { supabase, user } = await requireUser();

  // RLS protège l'accès. On lit le rappel via la même RLS — si l'user ne
  // peut pas le voir (ni créateur ni circle), maybeSingle renvoie null.
  const { data: existing } = await supabase
    .from("reminders")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    redirect("/");
  }
  if (existing.status === "done") {
    return { error: "Ce rappel est déjà marqué fait." };
  }

  const nowIso = new Date().toISOString();
  const nextAtIso = parsed.data.snoozeUntil.toISOString();

  const { error: insertErr } = await supabase.from("snooze_reasons").insert({
    reminder_id: id,
    user_id: user.id,
    reason: parsed.data.reason,
  });
  if (insertErr) {
    console.warn("[snoozeReminder] insert:", insertErr.message);
    return { error: "Impossible d'enregistrer la raison." };
  }

  // status reste 'pending' : c'est le cron qui re-notifiera dans 10 min.
  // notified_at remis à null pour rouvrir la fenêtre de notification.
  const { error: updateErr } = await supabase
    .from("reminders")
    .update({
      scheduled_at: nextAtIso,
      notified_at: null,
      updated_at: nowIso,
    })
    .eq("id", id);
  if (updateErr) {
    console.warn("[snoozeReminder] update:", updateErr.message);
    return { error: "Impossible de reprogrammer le rappel." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
