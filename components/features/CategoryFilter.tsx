"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = searchParams.get("category") ?? "";

  if (categories.length === 0) return null;

  const setCategory = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  const all = [{ value: "", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))];

  return (
    <div
      role="group"
      aria-label="Filtre catégorie"
      className="-mx-1 flex gap-px overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {all.map(({ value, label }) => {
        const active = current === value;
        return (
          <button
            key={value || "__all__"}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => setCategory(value)}
            className={cn(
              "shrink-0 border px-2.5 py-1 cursor-pointer touch-manipulation",
              "font-mono text-[10px] uppercase tracking-[0.14em]",
              "transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
