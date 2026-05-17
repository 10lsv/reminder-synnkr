"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptCircleInvite } from "@/app/actions/circles";
import { Button } from "@/components/ui/Button";

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onAccept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptCircleInvite(token);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <Button type="button" variant="primary" fullWidth onClick={onAccept} disabled={pending}>
        {pending ? "…" : "Confirmer"}
      </Button>
      <Link
        href="/"
        className="text-sm text-fg-secondary underline-offset-4 hover:underline"
      >
        Annuler
      </Link>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
