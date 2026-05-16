"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Home,
  List,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/calendrier", label: "Calendrier", icon: Calendar },
  { href: "/rappels", label: "Liste", icon: List },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/reglages", label: "Réglages", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBottom() {
  const pathname = usePathname();

  // Sur l'écran rappel actif, aucun chrome (cf. BRIEF §6.6).
  if (pathname.startsWith("/actif/")) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg"
    >
      <ul className="mx-auto flex max-w-sm items-stretch justify-around px-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex items-center justify-center px-2 py-3"
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    "transition-colors duration-150 ease-out",
                    active ? "bg-accent-bg" : "bg-transparent",
                  )}
                >
                  <Icon
                    size={26}
                    strokeWidth={2}
                    aria-hidden
                    className={cn(
                      "transition-colors duration-150 ease-out",
                      active ? "text-fg" : "text-fg-secondary",
                    )}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
