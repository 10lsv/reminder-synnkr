"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Filter = "pending" | "done" | "all";

const tabs: { value: Filter; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "done", label: "Faits" },
  { value: "all", label: "Tous" },
];

export function ReminderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = ((): Filter => {
    const raw = searchParams.get("filter");
    if (raw === "done" || raw === "all") return raw;
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
      className="flex gap-6 border-b border-border"
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
              "relative pb-3 text-sm cursor-pointer touch-manipulation transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed",
              active
                ? "font-medium text-fg"
                : "font-normal text-fg-secondary hover:text-fg",
            )}
          >
            {label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-[2px] bg-fg"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
