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

  return (
    <div
      role="group"
      aria-label="Filtre catégorie"
      className="flex flex-wrap gap-2"
    >
      {[{ value: "", label: "Toutes" }, ...categories.map((c) => ({ value: c, label: c }))].map(
        ({ value, label }) => {
          const active = current === value;
          return (
            <button
              key={value || "__all__"}
              type="button"
              aria-pressed={active}
              disabled={pending}
              onClick={() => setCategory(value)}
              className={cn(
                "rounded-pill border px-[12px] py-1.5 text-xs uppercase tracking-label cursor-pointer touch-manipulation",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-fg bg-fg text-bg"
                  : "border-border bg-transparent text-fg-secondary hover:border-fg-secondary",
              )}
            >
              {label}
            </button>
          );
        },
      )}
    </div>
  );
}
