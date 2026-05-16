"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RECURRENCE_VALUES } from "@/lib/recurrence";
import { createClient } from "@/lib/supabase/server";

const reminderSchema = z.object({
  message: z.string().trim().min(1).max(500),
  scheduledAt: z
    .string()
    .min(1)
    .transform((v, ctx) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: "custom", message: "Date invalide" });
        return z.NEVER;
      }
      return d;
    })
    .refine((d) => d.getTime() > Date.now(), { message: "Date passée" }),
  recurrence: z.enum(RECURRENCE_VALUES).default("none"),
  category: z
    .string()
    .trim()
    .max(30)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
});

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
  const parsed = reminderSchema.safeParse({
    message: formData.get("message"),
    scheduledAt: formData.get("scheduledAt"),
    recurrence: formData.get("recurrence") ?? "none",
    category: formData.get("category") ?? "",
  });
  if (!parsed.success) {
    console.warn(
      "[createReminder] validation:",
      parsed.error.flatten().fieldErrors,
    );
    return { error: "Vérifie ton message et la date." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    message: parsed.data.message,
    scheduled_at: parsed.data.scheduledAt.toISOString(),
    recurrence: parsed.data.recurrence,
    category: parsed.data.category,
  });
  if (error) {
    console.warn("[createReminder] db:", error.message);
    return { error: "Impossible de créer le rappel." };
  }

  revalidatePath("/rappels");
  revalidatePath("/");
  redirect("/rappels");
}

export async function updateReminder(
  id: string,
  _prev: ReminderFormState,
  formData: FormData,
): Promise<ReminderFormState> {
  const parsed = reminderSchema.safeParse({
    message: formData.get("message"),
    scheduledAt: formData.get("scheduledAt"),
    recurrence: formData.get("recurrence") ?? "none",
    category: formData.get("category") ?? "",
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
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    redirect("/rappels");
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      message: parsed.data.message,
      scheduled_at: parsed.data.scheduledAt.toISOString(),
      recurrence: parsed.data.recurrence,
      category: parsed.data.category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.warn("[updateReminder] db:", error.message);
    return { error: "Impossible de mettre à jour." };
  }

  revalidatePath("/rappels");
  revalidatePath(`/rappels/${id}`);
  revalidatePath("/");
  redirect(`/rappels/${id}`);
}

export async function deleteReminder(id: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("reminders")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    redirect("/rappels");
  }

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.warn("[deleteReminder] db:", error.message);
  }

  revalidatePath("/rappels");
  revalidatePath("/");
  redirect("/rappels");
}

export async function markAsDone(id: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("reminders")
    .update({
      status: "done",
      done_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.warn("[markAsDone] db:", error.message);
  }

  revalidatePath("/rappels");
  revalidatePath("/");
  redirect("/");
}

const SNOOZE_MIN_CHARS = 10;
const SNOOZE_MAX_CHARS = 500;
const SNOOZE_DURATION_MS = 10 * 60 * 1000;

const snoozeSchema = z.object({
  reason: z.string().trim().min(SNOOZE_MIN_CHARS).max(SNOOZE_MAX_CHARS),
});

export type SnoozeFormState = { error: string | null };

export async function snoozeReminder(
  id: string,
  _prev: SnoozeFormState,
  formData: FormData,
): Promise<SnoozeFormState> {
  const parsed = snoozeSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return {
      error: `Donne une raison d'au moins ${SNOOZE_MIN_CHARS} caractères.`,
    };
  }

  const { supabase, user } = await requireUser();

  // RLS protège déjà mais on vérifie l'ownership pour renvoyer un état propre.
  const { data: existing } = await supabase
    .from("reminders")
    .select("user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    redirect("/");
  }
  if (existing.status === "done") {
    return { error: "Ce rappel est déjà marqué fait." };
  }

  const nowIso = new Date().toISOString();
  const nextAtIso = new Date(Date.now() + SNOOZE_DURATION_MS).toISOString();

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
    .eq("id", id)
    .eq("user_id", user.id);
  if (updateErr) {
    console.warn("[snoozeReminder] update:", updateErr.message);
    return { error: "Impossible de reprogrammer le rappel." };
  }

  revalidatePath("/rappels");
  revalidatePath("/");
  redirect("/");
}
