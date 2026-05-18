"use client";

import { useEffect, useState } from "react";
import {
  sendTestNotification,
  subscribePush,
  unsubscribePush,
} from "@/app/actions/push";
import { Button } from "@/components/ui/Button";

type State =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "needs-install" }
  | { kind: "needs-permission" }
  | { kind: "permission-denied" }
  | { kind: "subscribed" };

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isStandaloneDisplay(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari < 16 expose un flag legacy sur navigator.
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function NotificationsSettings() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;

      // iOS Safari n'expose PushManager/Notification qu'en mode standalone
      // (après "Ajouter à l'écran d'accueil"). On check ça AVANT le support,
      // sinon on dirait "non supporté" alors qu'il suffit d'installer.
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && !isStandaloneDisplay()) {
        setState({ kind: "needs-install" });
        return;
      }

      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) {
        setState({ kind: "unsupported" });
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      if (Notification.permission === "denied") {
        setState({ kind: "permission-denied" });
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // Le browser garde la sub même si notre DB l'a perdue. On re-upsert
        // systématiquement (idempotent grâce à unique user_id+endpoint). Si la
        // resync rate, on désinscrit côté browser pour repartir propre — sinon
        // l'utilisateur reste coincé en état "subscribed" sans rien en DB.
        try {
          const result = await subscribePush(existing.toJSON());
          if (!result.ok) {
            console.warn("[NotificationsSettings] resync failed:", result.error);
            await existing.unsubscribe().catch(() => {});
            setFeedback(`Resync impossible : ${result.error}`);
            setState({ kind: "needs-permission" });
            return;
          }
        } catch (err) {
          console.warn("[NotificationsSettings] resync threw:", err);
          await existing.unsubscribe().catch(() => {});
          setFeedback(
            `Resync exception : ${err instanceof Error ? err.message : "inconnue"}`,
          );
          setState({ kind: "needs-permission" });
          return;
        }
        setState({ kind: "subscribed" });
      } else {
        setState({ kind: "needs-permission" });
      }
    })().catch((err) => {
      console.warn("[NotificationsSettings] init:", err);
      setState({ kind: "unsupported" });
    });
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    setFeedback(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState({ kind: "permission-denied" });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      const result = await subscribePush(sub.toJSON());
      if (!result.ok) {
        setFeedback(result.error);
        return;
      }
      setState({ kind: "subscribed" });
    } catch (err) {
      console.warn("[handleSubscribe]:", err);
      setFeedback("Impossible d'activer les notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setBusy(true);
    setFeedback(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const endpoint = existing.endpoint;
        await existing.unsubscribe();
        await unsubscribePush(endpoint);
      }
      setState({ kind: "needs-permission" });
    } catch (err) {
      console.warn("[handleUnsubscribe]:", err);
      setFeedback("Impossible de désactiver.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await sendTestNotification();
      if (result.sent === 0 && result.failed === 0) {
        setFeedback("Aucun abonnement trouvé.");
      } else if (result.sent === 0) {
        setFeedback(`Échec sur ${result.failed} envoi(s).`);
      } else {
        setFeedback(
          result.failed > 0
            ? `Envoyé à ${result.sent} appareil(s), ${result.failed} échec(s).`
            : `Envoyé à ${result.sent} appareil(s).`,
        );
      }
    } catch (err) {
      console.warn("[handleTest]:", err);
      setFeedback("Échec du test.");
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        // chargement…
      </p>
    );
  }

  if (state.kind === "unsupported") {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        // non supporté sur ce navigateur
      </p>
    );
  }

  if (state.kind === "needs-install") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-foreground">
          Ajoute Reminder à ton écran d&apos;accueil pour activer les
          notifications :
        </p>
        <ol className="flex flex-col gap-1.5 pl-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground list-decimal">
          <li>Appuie sur ⤴ Partager</li>
          <li>Ajouter à l&apos;écran d&apos;accueil</li>
          <li>Ouvre depuis l&apos;icône, reviens ici</li>
        </ol>
      </div>
    );
  }

  if (state.kind === "permission-denied") {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        // bloqué — réglages iOS → notifications → reminder
      </p>
    );
  }

  if (state.kind === "needs-permission") {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          // inactif
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubscribe}
          disabled={busy}
          fullWidth
        >
          {busy ? "…" : "Activer →"}
        </Button>
        {feedback && (
          <p
            role="alert"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-destructive"
          >
            {feedback}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-1.5 bg-success animate-pulse-dot"
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
          Actif sur cet appareil
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={busy}
        >
          {busy ? "…" : "Test"}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleUnsubscribe}
          disabled={busy}
        >
          Désactiver
        </Button>
      </div>
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
