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

  // Sur l'écran rappel actif, aucun chrome.
  if (pathname.startsWith("/actif/")) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-md"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around pt-1.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex items-center justify-center py-1.5"
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-all duration-300 ease-out transform-gpu",
                    "active:scale-90 active:duration-100",
                    active
                      ? "bg-accent text-accent-foreground scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 scale-100",
                  )}
                >
                  <Icon className="size-[20px]" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
