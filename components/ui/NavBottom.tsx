"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  short: string;
}

const items: NavItem[] = [
  { href: "/", label: "Accueil", short: "HOME" },
  { href: "/calendrier", label: "Calendrier", short: "CAL" },
  { href: "/rappels", label: "Liste", short: "LIST" },
  { href: "/stats", label: "Stats", short: "STAT" },
  { href: "/reglages", label: "Réglages", short: "PREF" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBottom() {
  const pathname = usePathname();

  if (pathname.startsWith("/actif/")) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-5xl grid-cols-5">
        {items.map(({ href, label, short }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center justify-center font-mono text-[10px] font-medium tracking-[0.18em] uppercase transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {short}
              </Link>
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-foreground"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
