"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Swords,
  Trophy,
  Radio,
  User,
  CalendarClock,
  Gift,
  Medal,
  ClipboardList,
  BarChart3,
  QrCode,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const PLAYER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/loyalty", label: "Rewards", icon: Gift },
  { href: "/checkin", label: "My QR", icon: QrCode },
];

const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Staff Desk", icon: ClipboardList },
];

const CHEF_NAV: NavItem[] = [
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
];

// Mobile bottom bar: the 5 core destinations
const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/matches", label: "Play", icon: Swords },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = [
    ...PLAYER_NAV,
    ...(role === "EMPLOYEE" || role === "CHEF" ? STAFF_NAV : []),
    ...(role === "CHEF" ? CHEF_NAV : []),
  ];

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-emerald-accent/12 text-emerald-bright"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon size={19} className={active ? "text-emerald-bright" : ""} />
            {item.label}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-bright" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ live }: { live?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-emerald-bright" : "text-muted"
              )}
            >
              <span className="relative">
                <item.icon size={22} />
                {item.href === "/live" && live && (
                  <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-live animate-pulse-live" />
                )}
              </span>
              {item.label}
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-bright" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
