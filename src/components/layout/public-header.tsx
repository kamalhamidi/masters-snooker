import Link from "next/link";
import { auth } from "@/lib/auth";
import { getClubSettings } from "@/lib/club";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function PublicHeader() {
  const [session, settings] = await Promise.all([auth(), getClubSettings()]);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Public" className="ml-6 hidden items-center gap-5 text-sm font-medium text-muted md:flex">
          <Link href="/#about" className="transition-colors hover:text-foreground">About</Link>
          <Link href="/#tournaments" className="transition-colors hover:text-foreground">Tournaments</Link>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground">Leaderboard</Link>
          <Link href="/live" className="flex items-center gap-2 transition-colors hover:text-foreground">
            Live {settings.isLive && <LiveBadge />}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard">
              <Button size="sm">My dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Join the club</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
