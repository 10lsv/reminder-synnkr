"use client";

import { useEffect, useState } from "react";
import { formatDateLong, formatDateStamp } from "@/lib/dates";

type Mode = "long" | "stamp";

export function TodayLabel({
  fallback = "",
  mode = "long",
}: {
  fallback?: string;
  mode?: Mode;
}) {
  const [text, setText] = useState<string>(fallback);
  useEffect(() => {
    setText(
      mode === "stamp"
        ? formatDateStamp(new Date())
        : formatDateLong(new Date()),
    );
  }, [mode]);
  return <>{text}</>;
}
