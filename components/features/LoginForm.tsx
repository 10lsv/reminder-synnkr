"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: SignInState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <Input
        name="identifiant"
        label="Identifiant"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />
      <Input
        name="password"
        label="Mot de passe"
        type="password"
        placeholder="Min. 8 caractères"
        autoComplete="current-password"
        required
      />
      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      {state.error && (
        <p role="alert" className="text-center text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
