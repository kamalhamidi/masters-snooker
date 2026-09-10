import Link from "next/link";
import { Bell, CalendarClock, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubSettings } from "@/lib/club";
import { Logo } from "./logo";
import { SidebarNav, BottomNav } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { SignOutButton } from "./sign-out-button";
import { Avatar } from "@/components/ui/avatar";
import { LiveBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const settings = await getClubSettings();

  const unread = session
    ? await prisma.notification.count({
        where: { userId: session.user.id, read: false },
      })
    : 0;

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      {session && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-elevated p-5 lg:flex overflow-y-auto">
          <Logo href="/dashboard" className="mb-8" />
          <p className="eyebrow mb-3 px-3.5 text-faint">Your club</p>
          <SidebarNav role={session.user.role} />
          <div className="mt-auto space-y-2 pt-6">
            <Link
              href="/reservations"
              className="mb-4 block rounded-xl border border-gold/20 bg-gold/5 p-4"
            >
              <CalendarClock size={20} className="mb-2 text-gold" />
              <span className="block text-sm font-semibold">
                Make time for a frame.
              </span>
              <span className="mt-1 flex items-center justify-between text-xs text-muted">
                Reserve your next session
                <ChevronRight size={14} />
              </span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
            >
              <Avatar
                name={session.user.name}
                src={session.user.avatarUrl}
                size="sm"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {session.user.name}
                </span>
                <span className="block text-xs capitalize text-faint">
                  {session.user.role.toLowerCase()}
                </span>
              </span>
            </Link>
            <SignOutButton />
          </div>
        </aside>
      )}

      <div className={session ? "lg:pl-64" : ""}>
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 border-b border-border">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
            <Logo href={session ? "/dashboard" : "/"} className="lg:hidden" />
            <span className="eyebrow hidden text-muted lg:block">
              Master’s Snooker / Member club
            </span>
            {settings.isLive && (
              <Link href="/live" className="hidden sm:block">
                <LiveBadge />
              </Link>
            )}
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              {session ? (
                <Link
                  href="/notifications"
                  aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <Bell size={19} />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-live px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants({ size: "sm" })}
                  >
                    Join the club
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-12"
        >
          {children}
        </main>
      </div>

      {session && <BottomNav live={settings.isLive} role={session.user.role} />}
    </div>
  );
}
