import Link from "next/link";
import {
  Trophy,
  MapPin,
  Clock,
  ArrowRight,
  Radio,
  Crown,
  Swords,
  Medal,
  CalendarClock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getClubSettings } from "@/lib/club";
import Image from "next/image";
import { formatCents, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCounter } from "@/components/ui/stat-counter";
import { Reveal } from "@/components/motion";

export const revalidate = 60;

export default async function LandingPage() {
  const [settings, tournaments, topPlayers, stats] = await Promise.all([
    getClubSettings(),
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
  const [playerCount, matchCount, tournamentCount, tableCount] = stats;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[min(100dvh,900px)] items-end overflow-hidden sm:items-center">
        <Image
          src="/masters_background.png"
          alt="Master's Snooker club — championship tables under warm pendant lights"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Readable gradient — darker on the left/bottom where copy sits */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-32">
          <div className="max-w-xl">
            {settings.isLive && (
              <Reveal>
                <Link
                  href="/live"
                  className="mb-6 inline-flex items-center gap-3 rounded-full border border-live/40 bg-black/40 py-2 pl-2 pr-4 text-sm text-white backdrop-blur transition-transform hover:scale-[1.02]"
                >
                  <LiveBadge />
                  <span className="font-medium">
                    {settings.streamTitle ?? "We are live now"}
                  </span>
                  <ArrowRight size={15} />
                </Link>
              </Reveal>
            )}
            <Reveal delay={0.05}>
              <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-white sm:text-7xl">
                Where every frame
                <br />
                <span className="gold-text">makes a master.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-lg text-lg text-emerald-100/90">
                Championship-grade tables, ranked matches, tournaments and a live
                leaderboard. Join the club, earn your points, climb to the top.
              </p>
            </Reveal>
            <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" variant="gold">
                  Become a member <ArrowRight size={17} />
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  View leaderboard
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────── */}
      <section className="border-y border-border bg-elevated">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {[
            { label: "Active players", value: playerCount, icon: Swords },
            { label: "Matches played", value: matchCount, icon: Medal },
            { label: "Tournaments hosted", value: tournamentCount, icon: Trophy },
            { label: "Pro tables", value: tableCount, icon: CalendarClock },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-2 h-6 w-6 text-emerald-bright" />
              <p className="font-display text-4xl tracking-wide">
                <StatCounter value={s.value} suffix="+" />
              </p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ────────────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              A club built for <span className="text-emerald-bright">serious play</span>
            </h2>
            <p className="mt-4 text-muted">
              Master&apos;s Snooker is a purpose-built club with six professional
              tables — including our VIP championship table — a full ranking
              system, referee-managed matches and streamed finals. Whether
              you&apos;re here for a friendly frame or chasing the club
              championship, there&apos;s a table waiting.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Elo-based ranking — beat stronger players, earn more points",
                "Loyalty rewards on every visit, match and booking",
                "Personal QR check-in, table reservations and match history",
                "Live-streamed championship nights",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span className="text-foreground/90">{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted">
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-bright" /> 12 Break Street, Downtown
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-bright" /> Daily 10 AM – 2 AM
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "01", t: "Six pro tables", d: "Tournament-spec cloth, re-leveled monthly." },
                { n: "02", t: "Ranked ladder", d: "Every ranked frame moves the leaderboard." },
                { n: "03", t: "Referee crew", d: "Staff-managed matches and instant results." },
                { n: "04", t: "VIP lounge", d: "Championship table with broadcast rig." },
              ].map((c) => (
                <Card key={c.n} className="hover:border-emerald-accent/40">
                  <p className="font-display text-3xl text-gold">{c.n}</p>
                  <p className="mt-2 font-semibold">{c.t}</p>
                  <p className="mt-1 text-sm text-muted">{c.d}</p>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Tournaments preview ──────────────────────────── */}
      <section id="tournaments" className="border-t border-border bg-elevated">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-4xl tracking-wide">Upcoming tournaments</h2>
              <p className="mt-1 text-muted">Register, pay online and play for the prize pool.</p>
            </div>
            <Link href="/tournaments" className="hidden text-sm font-medium text-emerald-bright hover:underline sm:block">
              See all →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {tournaments.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.07}>
                <Link href={`/tournaments/${t.slug}`}>
                  <Card className="group h-full transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5">
                    <div className="mb-4 flex items-center justify-between">
                      {t.isChampionship ? (
                        <Badge variant="gold"><Crown size={12} /> Championship</Badge>
                      ) : (
                        <Badge variant="emerald">{t.format.replace("_", " + ").toLowerCase()}</Badge>
                      )}
                      {t.status === "IN_PROGRESS" ? (
                        <Badge variant="live">In progress</Badge>
                      ) : (
                        <Badge>Registering</Badge>
                      )}
                    </div>
                    <h3 className="font-display text-2xl tracking-wide group-hover:text-gold-soft">
                      {t.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{t.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                      <span className="text-muted">{formatDate(t.startDate)}</span>
                      <span className="font-semibold text-gold">
                        {formatCents(t.prizePool)} pool
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-faint">
                      {t._count.entries}/{t.maxPlayers} registered · entry {formatCents(t.entryFee)}
                    </p>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leaderboard preview ──────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl tracking-wide">Club top 10</h2>
            <p className="mt-1 text-muted">The players setting the pace this season.</p>
          </div>
          <Link href="/leaderboard" className="text-sm font-medium text-emerald-bright hover:underline">
            Full leaderboard →
          </Link>
        </div>
        <Card className="overflow-hidden p-0">
          <ol>
            {topPlayers.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0 sm:px-6"
              >
                <span
                  className={`w-8 text-center font-display text-2xl ${
                    i === 0 ? "text-gold" : i < 3 ? "text-gold-soft/80" : "text-faint"
                  }`}
                >
                  {i + 1}
                </span>
                <Avatar name={p.user.name} src={p.user.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.user.name}</p>
                  <p className="text-xs text-muted">
                    Level {p.level} · {p._count.matchesWon} wins
                  </p>
                </div>
                {i === 0 && <Crown size={18} className="text-gold" />}
                <span className="font-display text-xl text-emerald-bright">
                  {p.points.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="felt-texture">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <Radio className="mx-auto mb-4 h-8 w-8 text-gold" />
          <h2 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
            Ready to chalk up?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100/80">
            Create your free player profile in under a minute. Reserve tables,
            enter tournaments, earn badges and climb the ladder.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" variant="gold">Join Master&apos;s Snooker</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Member login
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
