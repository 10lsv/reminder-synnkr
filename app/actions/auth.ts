"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Identifiant ou mot de passe incorrect.";

const signInSchema = z.object({
  identifiant: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/i)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8),
});

export type SignInState = { error: string | null };

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    identifiant: formData.get("identifiant"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    console.warn(
      "[signIn] validation failed:",
      parsed.error.flatten().fieldErrors,
    );
    return { error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: `${parsed.data.identifiant}@reminder.local`,
    password: parsed.data.password,
  });

  if (error) {
    console.warn("[signIn] auth failed:", error.message);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(_formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
