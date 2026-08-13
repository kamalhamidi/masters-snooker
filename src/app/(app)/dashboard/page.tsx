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
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6">
      {/* Greeting + trust badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Matches played", value: stats.played, icon: Swords, color: "text-emerald-bright" },
          { label: "Win rate", value: stats.winRate, suffix: "%", icon: TrendingUp, color: "text-gold" },
          { label: "Ranking points", value: player.points, icon: Trophy, color: "text-emerald-bright" },
          { label: "Badges earned", value: player._count.badges, icon: Medal, color: "text-gold" },
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
              <span className="font-display text-5xl text-gold">{lvl.level}</span>
            </div>
            <Progress value={lvl.pct} />
            <p className="text-center text-xs text-muted">
              {player.xp - lvl.currentLevelXp} / {lvl.nextLevelXp - lvl.currentLevelXp} XP
              to level {lvl.level + 1}
            </p>
            <p className="text-center text-xs text-faint">
              Beat higher-level players for bonus XP and bigger point swings.
            </p>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/reservations", label: "Book a table", icon: CalendarClock },
          { href: "/checkin", label: "My QR code", icon: QrCode },
          { href: "/loyalty", label: `${player.loyaltyPoints} pts`, icon: Gift },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="flex items-center gap-3 py-4 transition-all hover:-translate-y-0.5 hover:border-emerald-accent/50">
              <a.icon className="h-5 w-5 shrink-0 text-emerald-bright" />
              <span className="truncate text-sm font-semibold">{a.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upcoming */}
      {upcomingMatches.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">Your upcoming matches</h2>
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
          <h2 className="font-display text-2xl tracking-wide">Recent matches</h2>
          <Link href="/matches">
            <Button variant="ghost" size="sm">
              All matches <ArrowRight size={15} />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentMatches.map((m) => (
            <MatchRow key={m.id} match={m} perspectivePlayerId={playerId} />
          ))}
        </div>
      </section>
    </div>
  );
}
