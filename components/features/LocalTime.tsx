"use client";

import { useEffect, useState } from "react";
import { formatPreview, formatRelative, formatTime } from "@/lib/dates";

type Mode = "relative" | "preview" | "time";

interface LocalTimeProps {
  // ISO string ou Date sérialisable. La conversion est faite côté client,
  // donc dans la TZ du navigateur — évite que le rendu SSR (UTC sur Vercel)
  // affiche l'heure dans la mauvaise zone.
  iso: string;
  mode?: Mode;
  fallback?: string;
}

function render(iso: string, mode: Mode): string {
  switch (mode) {
    case "preview":
      return formatPreview(iso);
    case "time":
      return formatTime(iso);
    case "relative":
    default:
      return formatRelative(iso);
  }
}

export function LocalTime({
  iso,
  mode = "relative",
  fallback = "",
}: LocalTimeProps) {
  // Init identique sur serveur et client pour un hydrate propre, puis
  // useEffect remplace par la valeur en TZ navigateur.
  const [text, setText] = useState<string>(fallback);
  useEffect(() => {
    setText(render(iso, mode));
  }, [iso, mode]);
  return <>{text}</>;
}
