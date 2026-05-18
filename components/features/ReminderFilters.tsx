"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Filter = "pending" | "done" | "recurring" | "all";

const tabs: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
  { value: "recurring", label: "Loop" },
  { value: "all", label: "All" },
];

export function ReminderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = ((): Filter => {
    const raw = searchParams.get("filter");
    if (raw === "done" || raw === "all" || raw === "recurring") return raw;
    return "pending";
  })();

  const setFilter = (value: Filter) => {
    const params = new URLSearchParams(searchParams);
    if (value === "pending") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div role="tablist" aria-label="Filtre rappels" className="grid grid-cols-4">
      {tabs.map(({ value, label }) => {
        const active = current === value;
        return (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={pending}
            onClick={() => setFilter(value)}
            className={cn(
              "relative h-9 cursor-pointer touch-manipulation border-b transition-colors",
              "font-mono text-[10px] uppercase tracking-[0.18em]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
