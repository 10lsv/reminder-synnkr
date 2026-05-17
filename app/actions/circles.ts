"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function ensureUserCircle(): Promise<{
  circleId: string;
  isNew: boolean;
}> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.circle_id) {
    return { circleId: profile.circle_id, isNew: false };
  }

  const { data: created, error: createErr } = await supabase
    .from("circles")
    .insert({ created_by: user.id })
    .select("id")
    .single();
  if (createErr || !created) {
    console.warn("[ensureUserCircle] create circle:", createErr?.message);
    throw new Error("Impossible de créer le cercle.");
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ circle_id: created.id })
    .eq("id", user.id);
  if (updateErr) {
    console.warn("[ensureUserCircle] update profile:", updateErr.message);
    throw new Error("Impossible d'associer le cercle au profil.");
  }

  return { circleId: created.id, isNew: true };
}

export type CreateInviteResult =
  | { token: string; expiresAt: string }
  | { error: string };

export async function createCircleInvite(): Promise<CreateInviteResult> {
  try {
    const { circleId } = await ensureUserCircle();
    const { supabase, user } = await requireUser();
    const token = randomBytes(24).toString("base64url");

    const { data, error } = await supabase
      .from("circle_invites")
      .insert({
        circle_id: circleId,
        inviter_user_id: user.id,
        token,
      })
      .select("token, expires_at")
      .single();

    if (error || !data) {
      console.warn("[createCircleInvite]", error?.message);
      return { error: "Impossible de générer l'invitation." };
    }

    revalidatePath("/reglages");
    return { token: data.token, expiresAt: data.expires_at };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}

export type AcceptInviteResult = { ok: true } | { error: string };

export async function acceptCircleInvite(
  token: string,
): Promise<AcceptInviteResult> {
  const trimmed = token.trim();
  if (!trimmed) return { error: "Token manquant." };

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("accept_circle_invite", {
    p_token: trimmed,
  });

  if (error) {
    console.warn("[acceptCircleInvite]", error.message);
    if (error.message.includes("invalid_or_expired")) {
      return { error: "Lien invalide ou expiré." };
    }
    return { error: "Impossible d'accepter l'invitation." };
  }

  revalidatePath("/reglages");
  revalidatePath("/");
  return { ok: true };
}

export async function leaveCircle(): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ circle_id: null })
    .eq("id", user.id);
  if (error) {
    console.warn("[leaveCircle]", error.message);
  }

  revalidatePath("/reglages");
  revalidatePath("/");
  revalidatePath("/rappels");
  return { ok: true };
}
