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

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg"
    >
      <ul className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    "transition-colors duration-150 ease-out",
                    active ? "bg-accent-bg" : "bg-transparent",
                  )}
                >
                  <Icon
                    size={24}
                    strokeWidth={2}
                    aria-hidden
                    className={cn(
                      "transition-colors duration-150 ease-out",
                      active ? "text-fg" : "text-fg-secondary",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-[12px] leading-none transition-colors duration-150 ease-out",
                    active
                      ? "text-fg font-medium"
                      : "text-fg-secondary font-normal",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
