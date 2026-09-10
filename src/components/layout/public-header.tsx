import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getClubSettings } from "@/lib/club";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { PublicMobileNav } from "./public-mobile-nav";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export async function PublicHeader() {
  const { tr } = await getI18n();

  const [session, settings] = await Promise.all([auth(), getClubSettings()]);
  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-4">
        <Logo />
        <nav
          aria-label={tr("Public")}
          className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-muted xl:flex"
        >
          <Link
            href="/#about"
            className="py-3 transition-colors hover:text-foreground"
          >
            {tr("The club")}
          </Link>
          <Link
            href="/#tournaments"
            className="py-3 transition-colors hover:text-foreground"
          >
            {tr("Tournaments")}
          </Link>
          <Link
            href="/leaderboard"
            className="py-3 transition-colors hover:text-foreground"
          >
            {tr("Rankings")}
          </Link>
          <Link
            href="/live"
            className="flex items-center gap-2 py-3 transition-colors hover:text-foreground"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${settings.isLive ? "bg-live animate-pulse-live" : "bg-faint"}`}
            />
            {tr("Watch live")}
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={session ? "/dashboard" : "/login"}
            className="hidden px-3 py-3 text-sm font-semibold text-muted hover:text-foreground xl:block"
          >
            {session ? tr("Dashboard") : tr("Log in")}
          </Link>
          <Link
            href={session ? "/reservations" : "/register"}
            className={buttonVariants({
              variant: "gold",
              size: "sm",
              className: "hidden sm:inline-flex",
            })}
          >
            {session ? tr("Book a table") : tr("Join the club")}
            <ArrowUpRight size={16} />
          </Link>
          <PublicMobileNav signedIn={!!session} />
        </div>
      </div>
    </header>
  );
}
