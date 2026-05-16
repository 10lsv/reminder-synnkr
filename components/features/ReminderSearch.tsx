"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";

export function ReminderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      const query = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${query ? `?${query}` : ""}`);
      });
    }, 250);
  };

  return (
    <Input
      type="search"
      value={q}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Rechercher dans tes rappels…"
      aria-label="Rechercher"
    />
  );
}
