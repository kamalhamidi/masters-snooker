import Link from "next/link";
import { MapPin, Clock, Phone } from "lucide-react";
import { Logo } from "./logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-elevated">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            The city&apos;s home of snooker. Championship tables, ranked play,
            tournaments and a community that lives for the game.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <h3 className="font-display text-lg tracking-wide text-foreground">Visit us</h3>
          <p className="flex items-center gap-2.5">
            <MapPin size={16} className="shrink-0 text-emerald-bright" />
            12 Break Street, Downtown
          </p>
          <p className="flex items-center gap-2.5">
            <Clock size={16} className="shrink-0 text-emerald-bright" />
            Daily 10:00 AM — 2:00 AM
          </p>
          <p className="flex items-center gap-2.5">
            <Phone size={16} className="shrink-0 text-emerald-bright" />
            +20 100 000 0000
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="font-display text-lg tracking-wide text-foreground">Quick links</h3>
          <nav className="flex flex-col gap-2 text-muted" aria-label="Footer">
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">Leaderboard</Link>
            <Link href="/live" className="transition-colors hover:text-foreground">Live matches</Link>
            <Link href="/register" className="transition-colors hover:text-foreground">Become a member</Link>
            <Link href="/login" className="transition-colors hover:text-foreground">Member login</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-faint">
        © {new Date().getFullYear()} Master&apos;s Snooker Club. All rights reserved.
      </div>
    </footer>
  );
}
