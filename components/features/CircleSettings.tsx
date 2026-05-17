"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptCircleInvite,
  createCircleInvite,
  leaveCircle,
} from "@/app/actions/circles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CircleSettingsProps {
  inCircle: boolean;
}

// Extrait un token depuis soit une URL /associer?token=XXX soit la chaîne brute.
function parseTokenInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const t = url.searchParams.get("token");
    if (t) return t;
  } catch {
    // pas une URL — on traite comme token brut
  }
  return trimmed;
}

function buildInviteUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/associer?token=${encodeURIComponent(token)}`;
}

export function CircleSettings({ inCircle }: CircleSettingsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const onGenerate = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await createCircleInvite();
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setGeneratedToken(result.token);
    });
  };

  const onAccept = () => {
    setMessage(null);
    const token = parseTokenInput(pasteValue);
    if (!token) {
      setMessage({ tone: "error", text: "Colle un lien valide." });
      return;
    }
    startTransition(async () => {
      const result = await acceptCircleInvite(token);
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({ tone: "success", text: "Tu es associé ✓" });
      setPasteValue("");
      router.refresh();
    });
  };

  const onLeave = () => {
    startTransition(async () => {
      await leaveCircle();
      router.refresh();
    });
  };

  const onCopy = async () => {
    if (!generatedToken) return;
    try {
      await navigator.clipboard.writeText(buildInviteUrl(generatedToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  if (inCircle) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-secondary">
          Tu es associé à un cercle. Les rappels « commun » sont visibles et
          modifiables par tous les membres.
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={onLeave}
          disabled={pending}
        >
          {pending ? "…" : "Quitter le cercle"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-secondary">
          Tu n&apos;es associé à personne. Génère un lien à envoyer à ton
          associé, ou colle le lien qu&apos;il t&apos;a envoyé.
        </p>
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={onGenerate}
          disabled={pending}
        >
          {pending && !generatedToken ? "…" : "Générer un lien d'invitation"}
        </Button>

        {generatedToken && (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <p className="text-xs uppercase tracking-label text-fg-tertiary">
              Lien d&apos;invitation (valide 7 jours)
            </p>
            <p className="break-all text-sm text-fg">
              {buildInviteUrl(generatedToken)}
            </p>
            <button
              type="button"
              onClick={onCopy}
              className="self-start cursor-pointer text-sm text-fg-secondary underline-offset-4 hover:underline"
            >
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Input
          label="Coller un lien reçu"
          placeholder="https://…/associer?token=…"
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
        />
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={onAccept}
          disabled={pending || !pasteValue.trim()}
        >
          {pending ? "…" : "Rejoindre le cercle"}
        </Button>
      </div>

      {message && (
        <p
          role="alert"
          className={
            message.tone === "success"
              ? "text-sm text-success"
              : "text-sm text-danger"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
