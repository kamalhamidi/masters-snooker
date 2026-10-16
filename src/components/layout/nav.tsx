"use client";

import { useI18n } from "@/lib/i18n/provider";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SignOutButton } from "./sign-out-button";
import { usePathname } from "next/navigation";
import {
  Menu,
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
  Table2,
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
  { href: "/admin/tables", label: "Tables", icon: Table2 },
];

// Mobile bottom bar: the 5 core destinations
const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/matches", label: "Play", icon: Swords },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/reservations", label: "Book", icon: CalendarClock },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const { tr } = useI18n();

  const pathname = usePathname();
  const items = [
    ...PLAYER_NAV,
    ...(role === "EMPLOYEE" || role === "CHEF" ? STAFF_NAV : []),
    ...(role === "CHEF" ? CHEF_NAV : []),
  ];

  return (
    <nav aria-label={tr("Main")} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-emerald-accent/12 text-emerald-bright"
                : "text-muted hover:bg-surface-hover hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon
              size={19}
              className={active ? "text-emerald-bright" : ""}
            />
            {tr(item.label)}
            {active && (
              <span className="ms-auto h-1.5 w-1.5 rounded-full bg-emerald-bright" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ live, role }: { live?: boolean; role: Role }) {
  const { tr } = useI18n();

  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <>
      <nav
        aria-label={tr("Mobile")}
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
                  active ? "text-emerald-bright" : "text-muted",
                )}
              >
                <span className="relative">
                  <item.icon size={22} />
                  {item.href === "/live" && live && (
                    <span className="absolute -end-1.5 -top-1 h-2 w-2 rounded-full bg-live animate-pulse-live" />
                  )}
                </span>
                {tr(item.label)}
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-bright" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            aria-label={tr("Open all navigation")}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="relative flex min-h-[64px] min-w-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted hover:text-foreground"
          >
            <Menu size={22} />
            {tr("More")}
            {live && (
              <span className="absolute end-4 top-2 h-1.5 w-1.5 rounded-full bg-live" />
            )}
          </button>
        </div>
      </nav>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={tr("Your club")}
      >
        <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border-t border-border px-3.5 py-3 text-sm text-muted"
        >
          <User size={19} />
          {tr("My profile")}
        </Link>
        <SignOutButton />
      </Dialog>
    </>
  );
}
