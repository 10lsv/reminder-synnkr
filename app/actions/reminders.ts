"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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
}
