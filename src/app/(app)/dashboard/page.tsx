import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Trophy,
  Swords,
  TrendingUp,
  Medal,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  CalendarClock,
  Gift,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePlayerProfile, isStaffRole } from "@/lib/player";
import {
  getPlayerCoreStats,
  getPointsSeries,
  getRankPosition,
  matchInclude,
} from "@/lib/queries";
import { levelProgress } from "@/lib/points";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCounter } from "@/components/ui/stat-counter";
import { PointsChart } from "@/components/charts/points-chart";
import { MatchRow } from "@/components/features/match-row";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const playerId =
    session.user.playerId ??
    (isStaffRole(session.user.role)
      ? (await ensurePlayerProfile(session.user.id, session.user.role)).id
      : null);

  if (!playerId) redirect("/login");
  const player = await prisma.player.findUniqueOrThrow({
    where: { id: playerId },
    include: { user: true, _count: { select: { badges: true } } },
  });

  const [stats, series, rank, recentMatches, upcomingMatches] =
    await Promise.all([
      getPlayerCoreStats(playerId),
      getPointsSeries(playerId),
      getRankPosition(player.points),
      prisma.match.findMany({
        where: {
          status: "COMPLETED",
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
        },
        orderBy: { completedAt: "desc" },
        take: 4,
        include: matchInclude,
      }),
      prisma.match.findMany({
        where: {
          status: { in: ["SCHEDULED", "LIVE"] },
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
        },
        orderBy: { scheduledAt: "asc" },
        take: 3,
        include: matchInclude,
      }),
    ]);

  const lvl = levelProgress(player.xp);

  return (
    <div className="space-y-7">
      {/* Greeting + trust badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-muted">Your game, at a glance</p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">
            Hey, {player.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted">
            Rank <span className="font-semibold text-gold">#{rank}</span> in the
            club · {player.points.toLocaleString()} pts
          </p>
        </div>
        {player.trustBadge ? (
          <Badge variant="emerald" className="px-3 py-1.5 text-sm">
            <ShieldCheck size={15} /> Trusted member
          </Badge>
        ) : (
          <Badge className="px-3 py-1.5 text-sm">
            <ShieldAlert size={15} /> Standard member
          </Badge>
        )}
      </div>

      <section className="felt-texture overflow-hidden rounded-2xl border border-white/10 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="eyebrow mb-2 text-[#e8cd6e]">Make your next move</p>
            <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
              There’s a great frame ahead of you.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/65">
              Book your next session or check in when you arrive. We’ll keep
              track of the progress.
            </p>
          </div>
          <Link
            href="/reservations"
            className={buttonVariants({ variant: "gold", size: "lg" })}
          >
            <CalendarClock size={18} />
            Book a table
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
          {[
            {
              href: "/checkin",
              label: "Club check-in",
              detail: "Open your personal QR",
              icon: QrCode,
            },
            {
              href: "/tournaments",
              label: "Find your competition",
              detail: "Explore club tournaments",
              icon: Trophy,
            },
            {
              href: "/loyalty",
              label: `${player.loyaltyPoints.toLocaleString()} reward points`,
              detail: "See what you can redeem",
              icon: Gift,
            },
          ].map((action) => (
            <Link
              href={action.href}
              key={action.href}
              className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/10"
            >
              <action.icon size={21} className="shrink-0 text-[#e8cd6e]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {action.label}
                </span>
                <span className="mt-1 block text-xs text-white/60">
                  {action.detail}
                </span>
              </span>
              <ArrowRight
                size={15}
                className="ml-auto shrink-0 text-white/50"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Matches played",
            value: stats.played,
            icon: Swords,
            color: "text-emerald-bright",
          },
          {
            label: "Win rate",
            value: stats.winRate,
            suffix: "%",
            icon: TrendingUp,
            color: "text-gold",
          },
          {
            label: "Ranking points",
            value: player.points,
            icon: Trophy,
            color: "text-emerald-bright",
          },
          {
            label: "Badges earned",
            value: player._count.badges,
            icon: Medal,
            color: "text-gold",
          },
        ].map((s) => (
          <Card key={s.label} className="animate-rise">
            <s.icon className={`mb-3 h-5 w-5 ${s.color}`} />
            <p className="font-display text-4xl tracking-wide">
              <StatCounter value={s.value} suffix={s.suffix ?? ""} />
            </p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Points graph */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Points history</CardTitle>
            <Badge variant="emerald">last 90 days</Badge>
          </CardHeader>
          <PointsChart data={series} />
        </Card>

        {/* Level card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Level {lvl.level}</CardTitle>
            <Badge variant="gold">{player.xp.toLocaleString()} XP</Badge>
          </CardHeader>
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-gold/40 bg-felt">
              <span className="font-display text-5xl text-gold">
                {lvl.level}
              </span>
            </div>
            <Progress value={lvl.pct} />
            <p className="text-center text-xs text-muted">
              {player.xp - lvl.currentLevelXp} /{" "}
              {lvl.nextLevelXp - lvl.currentLevelXp} XP to level {lvl.level + 1}
            </p>
            <p className="text-center text-xs text-faint">
              Beat higher-level players for bonus XP and bigger point swings.
            </p>
          </div>
        </Card>
      </div>

      {/* Upcoming */}
      {upcomingMatches.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">
              Your upcoming matches
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map((m) => (
              <MatchRow key={m.id} match={m} perspectivePlayerId={playerId} />
            ))}
          </div>
        </section>
      )}

      {/* Recent matches */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide">
            Recent matches
          </h2>
          <Link
            href="/matches"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            All matches <ArrowRight size={15} />
          </Link>
        </div>
        <div className="space-y-3">
          {recentMatches.length === 0 && (
            <Card className="border-dashed py-10 text-center">
              <Swords size={28} className="mx-auto mb-3 text-emerald-bright" />
              <h3 className="font-display text-2xl">
                Your story starts with a frame.
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Your results will appear here after your first match. Book a
                table and ask the staff to set up a match.
              </p>
              <Link
                href="/reservations"
                className={buttonVariants({
                  variant: "secondary",
                  className: "mt-5",
                })}
              >
                Plan your first session
              </Link>
            </Card>
          )}
          {recentMatches.map((m) => (
            <MatchRow key={m.id} match={m} perspectivePlayerId={playerId} />
          ))}
        </div>
      </section>
    </div>
  );
}
