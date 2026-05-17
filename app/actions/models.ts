"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MODEL_COLORS, MODEL_STATUSES } from "@/lib/models";
import { createClient } from "@/lib/supabase/server";

const modelSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.enum(MODEL_COLORS),
  status: z.enum(MODEL_STATUSES).default("active"),
  ownerUserId: z.string().uuid().nullable().default(null),
});

export type ModelFormState = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function currentCircleId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("circle_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.circle_id ?? null;
}

export async function createModel(
  _prev: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "violet",
    status: formData.get("status") ?? "active",
    ownerUserId: formData.get("ownerUserId") || null,
  });
  if (!parsed.success) {
    return { error: "Vérifie le nom et la couleur." };
  }

  const { supabase, user } = await requireUser();
  const circleId = await currentCircleId(supabase, user.id);

  const { error } = await supabase.from("models").insert({
    user_id: user.id,
    circle_id: circleId,
    name: parsed.data.name,
    color: parsed.data.color,
    status: parsed.data.status,
    owner_user_id: parsed.data.ownerUserId,
  });
  if (error) {
    console.warn("[createModel] db:", error.message);
    return { error: "Impossible de créer la model." };
  }

  revalidatePath("/models");
  revalidatePath("/rappels/nouveau");
  return { error: null };
}

export async function updateModel(
  id: string,
  _prev: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "violet",
    status: formData.get("status") ?? "active",
    ownerUserId: formData.get("ownerUserId") || null,
  });
  if (!parsed.success) {
    return { error: "Vérifie le nom et la couleur." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("models")
    .update({
      name: parsed.data.name,
      color: parsed.data.color,
      status: parsed.data.status,
      owner_user_id: parsed.data.ownerUserId,
    })
    .eq("id", id);
  if (error) {
    console.warn("[updateModel] db:", error.message);
    return { error: "Impossible de mettre à jour." };
  }

  revalidatePath("/models");
  revalidatePath("/rappels");
  return { error: null };
}

export async function setModelStatus(
  id: string,
  status: "active" | "paused" | "dropped",
): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("models").update({ status }).eq("id", id);
  revalidatePath("/models");
  revalidatePath("/rappels");
}

export async function deleteModel(id: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("models").delete().eq("id", id);
  revalidatePath("/models");
  revalidatePath("/rappels");
}
