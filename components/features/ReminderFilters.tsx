"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Filter = "pending" | "done" | "recurring" | "all";

const tabs: { value: Filter; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "done", label: "Faits" },
  { value: "recurring", label: "Récurrents" },
  { value: "all", label: "Tous" },
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
    <div
      role="tablist"
      aria-label="Filtre rappels"
      className="grid grid-cols-4 gap-0 border-b border-border"
    >
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
              "relative pb-2.5 text-center text-sm cursor-pointer touch-manipulation transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed",
              active
                ? "font-medium text-foreground"
                : "font-normal text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-[2px] bg-foreground"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
