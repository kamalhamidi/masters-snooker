import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Check,
  Users,
  Gift,
  Trophy,
  Crown,
  Swords,
  CalendarClock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getClubSettings } from "@/lib/club";
import Image from "next/image";
import { formatCents, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCounter } from "@/components/ui/stat-counter";
import { Reveal } from "@/components/motion";

export const revalidate = 60;

export default async function LandingPage() {
  const { tr, locale } = await getI18n();

  const settings = await getClubSettings();
  let tournaments: Awaited<ReturnType<typeof prisma.tournament.findMany<{
    where: { status: { in: ["REGISTRATION", "IN_PROGRESS"] } };
    orderBy: { startDate: "asc" };
    take: 3;
    include: { _count: { select: { entries: true } } };
  }>>> = [];
  let topPlayers: Awaited<ReturnType<typeof prisma.player.findMany<{
    orderBy: { points: "desc" };
    take: 10;
    include: {
      user: { select: { name: true; avatarUrl: true } };
      _count: { select: { matchesWon: true } };
    };
  }>>> = [];
  let stats: [number, number, number, number] = [0, 0, 0, 0];

  try {
    const [t, p, s] = await Promise.all([
      prisma.tournament.findMany({
        where: { status: { in: ["REGISTRATION", "IN_PROGRESS"] } },
        orderBy: { startDate: "asc" },
        take: 3,
        include: { _count: { select: { entries: true } } },
      }),
      prisma.player.findMany({
        orderBy: { points: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, avatarUrl: true } },
          _count: { select: { matchesWon: true } },
        },
      }),
      Promise.all([
        prisma.player.count(),
        prisma.match.count({ where: { status: "COMPLETED" } }),
        prisma.tournament.count(),
        prisma.table.count(),
      ]),
    ]);
    tournaments = t;
    topPlayers = p;
    stats = s;
  } catch (error) {
    console.error("[LandingPage] Database query error:", error);
  }

  const [playerCount, matchCount, tournamentCount, tableCount] = stats;
  const featured = tournaments[0];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#0b110e] text-white">
        <Image
          src="/masters_background.png"
          alt={tr("Snooker tables beneath warm pendant lights at the club")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#060e0a]/95 via-[#060e0a]/65 to-[#060e0a]/20"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0b110e] via-transparent to-[#0b110e]/20"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:min-h-[690px] lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16 lg:pb-24">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-3 text-[#e8cd6e]">
              <span className="h-px w-8 bg-[#d4af37]" />
              {tr("The game. The people. The club.")}
            </p>
            <h1 className="font-display text-[clamp(4rem,8.5vw,7.5rem)] leading-[.9] tracking-wide">
              {tr("YOUR NEXT")}
              <br />
              {tr("GREAT FRAME")}
              <br />
              <span className="text-[#e8cd6e]">{tr("STARTS HERE.")}</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              {tr(
                "Find your table. Meet your competition. Make your mark. Welcome to Master's Snooker.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/reservations"
                className={buttonVariants({ variant: "gold", size: "lg" })}
              >
                {tr("Book a table")} <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/#about"
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                  className:
                    "border-white/25 bg-white/5 text-white hover:bg-white/15",
                })}
              >
                {tr("Explore the club")} <ArrowDown size={16} />
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-3 text-sm text-white/65">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
                <Check size={14} className="text-[#e8cd6e]" />
              </span>
              {tr(
                "Friendly frames to championship nights. All levels welcome.",
              )}
            </div>
          </div>
          <div className="lg:mt-28">
            <div className="hero-panel overflow-hidden rounded-2xl border border-white/15">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <span className="eyebrow text-white/60">
                  {tr("On the club calendar")}
                </span>
                <Trophy size={17} className="text-[#e8cd6e]" />
              </div>
              <div className="p-6 sm:p-7">
                {settings.isLive && (
                  <Link
                    href="/live"
                    className="mb-5 flex items-center gap-3 text-sm text-white"
                  >
                    <LiveBadge />
                    <span className="truncate">
                      {settings.streamTitle ?? tr("Watch the action")}
                    </span>
                    <ArrowUpRight size={16} className="ms-auto shrink-0" />
                  </Link>
                )}
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#e8cd6e]">
                  {featured
                    ? featured.status === "IN_PROGRESS"
                      ? tr("Competition in progress")
                      : tr("Your next challenge")
                    : tr("Make time for the game")}
                </p>
                <h2 className="font-display text-4xl leading-none tracking-wide">
                  {featured?.name ?? tr("A table. A cue. Your moment.")}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  {featured
                    ? formatDate(featured.startDate, locale)
                    : tr(
                        "Plan your next visit with hourly table availability and simple online reservations.",
                      )}
                </p>
                {featured && (
                  <div className="mt-6 grid grid-cols-2 gap-4 border-y border-white/10 py-5">
                    <div>
                      <p className="text-xs text-white/50">
                        {tr("Prize pool")}
                      </p>
                      <p className="mt-1 font-display text-3xl text-[#e8cd6e]">
                        {formatCents(featured.prizePool, locale)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">
                        {tr("Players registered")}
                      </p>
                      <p className="mt-1 font-display text-3xl">
                        {featured._count.entries}
                        <span className="text-xl text-white/40">
                          {" "}
                          / {featured.maxPlayers}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                <Link
                  href={
                    featured ? `/tournaments/${featured.slug}` : "/reservations"
                  }
                  className="mt-6 flex min-h-11 items-center justify-between text-sm font-bold text-[#e8cd6e]"
                >
                  {featured ? tr("View tournament") : tr("Find your table")}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] uppercase tracking-[.2em] text-white/50">
              {tr("A little focus. A lot of possibility.")}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label={tr("The club in numbers")}
        className="border-y border-border bg-elevated"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { label: tr("Club players"), value: playerCount, icon: Users },
            {
              label: tr("Frames of competition"),
              value: matchCount,
              icon: Swords,
            },
            { label: tr("Tournaments"), value: tournamentCount, icon: Trophy },
            {
              label: tr("Tables to play"),
              value: tableCount,
              icon: CalendarClock,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-center gap-4 px-3 py-4"
            >
              <stat.icon size={24} className="hidden text-gold sm:block" />
              <div>
                <p className="font-display text-4xl leading-none">
                  <StatCounter value={stat.value} />
                </p>
                <p className="mt-2 text-xs text-muted">{tr(stat.label)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="about"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-gold">
              {tr("More than a place to play")}
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              {tr("YOUR CLUB. YOUR NEXT LEVEL.")}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {tr(
              "From your first friendly frame to the final black. Everything you need to enjoy the game, in one place.",
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: tr("Make it a table for you."),
              description: tr(
                "Choose your table, find a time that fits, and get your next session on the calendar.",
              ),
              action: tr("Find a table"),
              href: "/reservations",
              icon: CalendarClock,
            },
            {
              n: "02",
              title: tr("A little friendly rivalry."),
              description: tr(
                "Play ranked matches, track your progress, and see how you measure up against the club.",
              ),
              action: tr("Explore the rankings"),
              href: "/leaderboard",
              icon: Swords,
            },
            {
              n: "03",
              title: tr("Every visit counts."),
              description: tr(
                "Check in, play your frames, and turn your time at the club into achievements and rewards.",
              ),
              action: tr("Discover rewards"),
              href: "/loyalty",
              icon: Gift,
            },
          ].map((item) => (
            <Link
              key={item.n}
              href={item.href}
              className="group rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-gold/50 hover:bg-surface-hover"
            >
              <div className="mb-10 flex items-center justify-between">
                <item.icon size={28} strokeWidth={1.4} className="text-gold" />
                <span className="font-display text-2xl text-faint">
                  {item.n}
                </span>
              </div>
              <h3 className="font-display text-3xl tracking-wide">
                {tr(item.title)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {tr(item.description)}
              </p>
              <span className="mt-7 flex items-center justify-between text-sm font-semibold text-emerald-bright">
                {tr(item.action)}
                <ArrowUpRight
                  size={19}
                  className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="tournaments" className="border-y border-border bg-elevated">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3 text-gold">
                {tr("Step into the competition")}
              </p>
              <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
                {tr("BIG NIGHTS. GREAT MATCHES.")}
              </h2>
            </div>
            <Link
              href="/tournaments"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-bright"
            >
              {tr("All tournaments")} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {tournaments.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.06}>
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-gold/50"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden border-b border-border bg-felt">
                    <span
                      aria-hidden
                      className="absolute -end-2 -top-8 font-display text-[160px] leading-none text-white/5"
                    >
                      0{i + 1}
                    </span>
                    <Trophy
                      size={52}
                      strokeWidth={1}
                      className="text-[#e8cd6e]"
                    />
                    <div className="absolute start-4 top-4">
                      <Badge variant={t.isChampionship ? "gold" : "emerald"}>
                        {t.isChampionship
                          ? tr("Championship")
                          : tr("Club tournament")}
                      </Badge>
                    </div>
                    <span className="absolute bottom-4 end-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                      {t.status === "IN_PROGRESS"
                        ? tr("In progress")
                        : tr("Registration open")}
                    </span>
                  </div>
                  <div className="p-6">
                    <p className="mb-2 text-xs text-muted">
                      {formatDate(t.startDate, locale)}
                    </p>
                    <h3 className="font-display text-3xl tracking-wide group-hover:text-gold">
                      {t.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {t.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-[11px] text-muted">
                          {tr("Prize pool")}
                        </p>
                        <p className="font-display text-2xl text-gold">
                          {formatCents(t.prizePool, locale)}
                        </p>
                      </div>
                      <ArrowUpRight size={20} className="text-emerald-bright" />
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      {t._count.entries}/{t.maxPlayers} {tr("registered ·")}{" "}
                      {formatCents(t.entryFee, locale)} {tr("entry")}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
            {tournaments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-strong p-10 text-center md:col-span-3">
                <Trophy className="mx-auto mb-4 text-gold" size={32} />
                <h3 className="font-display text-3xl">
                  {tr("The next challenge is on its way.")}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {tr(
                    "Check back for upcoming tournaments. Your next frame doesn't have to wait.",
                  )}
                </p>
                <Link
                  href="/reservations"
                  className={buttonVariants({
                    variant: "secondary",
                    className: "mt-5",
                  })}
                >
                  {tr("Book a table")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <p className="eyebrow mb-3 text-gold">{tr("The club leaderboard")}</p>
          <h2 className="font-display text-5xl tracking-wide sm:text-6xl">
            {tr("THE ONES")}
            <br />
            {tr("TO")}{" "}
            <span className="text-emerald-bright">{tr("CATCH.")}</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            {tr(
              "Every ranked match tells a story. These are the players setting the pace. Where will you make your mark?",
            )}
          </p>
          <Link
            href="/leaderboard"
            className={buttonVariants({
              variant: "secondary",
              className: "mt-7",
            })}
          >
            {tr("View full leaderboard")} <ArrowUpRight size={17} />
          </Link>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="eyebrow text-muted">{tr("Club standings")}</span>
            <span className="text-xs text-muted">{tr("Rating points")}</span>
          </div>
          <ol>
            {topPlayers.slice(0, 5).map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 border-b border-border px-4 py-4 last:border-0 sm:gap-4 sm:px-6 ${i === 0 ? "bg-gold/5" : ""}`}
              >
                <span
                  className={`w-6 text-center font-display text-2xl ${i === 0 ? "text-gold" : "text-faint"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Avatar name={p.user.name} src={p.user.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {p.user.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {tr("Level")} {p.level} · {p._count.matchesWon} {tr("wins")}
                  </p>
                </div>
                {i === 0 && (
                  <Crown size={16} className="hidden text-gold sm:block" />
                )}
                <span className="font-display text-2xl text-emerald-bright">
                  {p.points.toLocaleString(locale)}
                </span>
              </li>
            ))}
          </ol>
          {topPlayers.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">
              {tr(
                "A fresh leaderboard. Join the club and play your first ranked match.",
              )}
            </p>
          )}
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="felt-texture relative overflow-hidden rounded-3xl border border-white/10 px-6 py-14 text-center text-white sm:px-12">
          <p className="eyebrow mb-4 text-[#e8cd6e]">
            {tr("Your place at the table")}
          </p>
          <h2 className="font-display text-5xl tracking-wide sm:text-7xl">
            {tr("GOOD GAMES. GREAT COMPANY.")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/70">
            {tr(
              "Your next chapter starts with a player profile. Join the club to book tables, enter tournaments, and make every frame count.",
            )}
          </p>
          <Link
            href="/register"
            className={buttonVariants({
              variant: "gold",
              size: "lg",
              className: "mt-8",
            })}
          >
            {tr("Become a member")} <ArrowUpRight size={18} />
          </Link>
          <p className="mt-4 text-xs text-white/60">
            {tr("Already part of the club?")}{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-white"
            >
              {tr("Log in")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
