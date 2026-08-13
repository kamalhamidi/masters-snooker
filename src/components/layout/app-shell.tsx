import Link from "next/link";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubSettings } from "@/lib/club";
import { Logo } from "./logo";
import { SidebarNav, BottomNav } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { SignOutButton } from "./sign-out-button";
import { Avatar } from "@/components/ui/avatar";
import { LiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-elevated p-5 lg:flex">
          <Logo href="/dashboard" className="mb-8" />
          <SidebarNav role={session.user.role} />
          <div className="mt-auto space-y-2 pt-6">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
            >
              <Avatar name={session.user.name} src={session.user.avatarUrl} size="sm" />
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
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
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
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Join the club</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      {session && <BottomNav live={settings.isLive} />}
    </div>
  );
}
