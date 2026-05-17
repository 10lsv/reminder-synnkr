"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Détection iOS robuste : userAgent classique + iPadOS 13+ qui se fait passer
// pour macOS (Safari sur iPad Pro). Critère iPadOS-as-Mac : touch points > 1.
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return (
    ua.includes("Mac") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  );
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari expose un flag non-standard quand la page tourne en PWA.
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function IOSInstallPrompt() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(detectIOS() && !detectStandalone());
  }, []);

  // Pas de chrome sur l'écran rappel actif (cf. BRIEF §6.6).
  if (pathname.startsWith("/actif/")) return null;
  if (!show) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pt-6">
      <div className="rounded-lg border border-accent bg-accent/30 p-5">
        <p className="text-base font-semibold text-foreground">
          Installe Reminder pour recevoir tes notifs
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sur iPhone, les rappels n&apos;arrivent que si l&apos;app est ajoutée
          à ton écran d&apos;accueil.
        </p>
        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm text-foreground">
          <li>Touche l&apos;icône Partager de Safari (en bas de l&apos;écran)</li>
          <li>Choisis « Ajouter à l&apos;écran d&apos;accueil »</li>
          <li>Ouvre Reminder depuis la nouvelle icône</li>
        </ol>
      </div>
    </div>
  );
}
