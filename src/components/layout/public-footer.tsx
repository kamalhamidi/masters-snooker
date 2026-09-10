import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { MapPin, Clock, Phone } from "lucide-react";
import { Logo } from "./logo";

export async function PublicFooter() {
  const { tr } = await getI18n();

  return (
    <footer className="border-t border-border bg-elevated">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo size="lg" />
          <p className="mt-4 max-w-xs text-sm text-muted">
            {tr(
              "The city's home of snooker. Championship tables, ranked play, tournaments and a community that lives for the game.",
            )}
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <h3 className="font-display text-lg tracking-wide text-foreground">
            {tr("Visit us")}
          </h3>
          <p className="flex items-center gap-2.5">
            <MapPin size={16} className="shrink-0 text-emerald-bright" />
            {tr("12 Break Street, Downtown")}
          </p>
          <p className="flex items-center gap-2.5">
            <Clock size={16} className="shrink-0 text-emerald-bright" />
            {tr("Daily 10:00 AM — 2:00 AM")}
          </p>
          <p className="flex items-center gap-2.5">
            <Phone size={16} className="shrink-0 text-emerald-bright" />
            +20 100 000 0000
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="font-display text-lg tracking-wide text-foreground">
            {tr("Quick links")}
          </h3>
          <nav
            className="flex flex-col gap-2 text-muted"
            aria-label={tr("Footer")}
          >
            <Link
              href="/leaderboard"
              className="transition-colors hover:text-foreground"
            >
              {tr("Leaderboard")}
            </Link>
            <Link
              href="/live"
              className="transition-colors hover:text-foreground"
            >
              {tr("Live matches")}
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-foreground"
            >
              {tr("Become a member")}
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              {tr("Member login")}
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-faint">
        © {new Date().getFullYear()}{" "}
        {tr("Master's Snooker Club. All rights reserved.")}
      </div>
    </footer>
  );
}
