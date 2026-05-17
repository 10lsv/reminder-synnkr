"use client";

import { useEffect, useState } from "react";
import { formatDateLong } from "@/lib/dates";

export function TodayLabel({ fallback = "" }: { fallback?: string }) {
  const [text, setText] = useState<string>(fallback);
  useEffect(() => {
    setText(formatDateLong(new Date()));
  }, []);
  return <>{text}</>;
}
