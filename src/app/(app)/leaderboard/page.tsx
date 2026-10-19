import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Leaderboard") };
}
export const revalidate = 30;

const PERIODS = [
  { key: "all", label: "All-time" },
  { key: "month", label: "This month" },
  { key: "week", label: "This week" },
] as const;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { tr, locale } = await getI18n();

  const { period } = await searchParams;
  const active = PERIODS.some((p) => p.key === period) ? period! : "all";

  // Compute period filter date upfront
  const since = new Date();
  if (active === "week") since.setDate(since.getDate() - 7);
  else if (active === "month") since.setMonth(since.getMonth() - 1);
  else since.setFullYear(2000);

  // Fire all 3 independent queries in parallel
  const [players, deltas, winCounts] = await Promise.all([
    prisma.player.findMany({
      orderBy: { points: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        badges: {
          include: { badge: true },
          take: 3,
          orderBy: { unlockedAt: "desc" },
        },
      },
    }),
    prisma.pointsHistory.groupBy({
      by: ["playerId"],
      where: { createdAt: { gte: since } },
      _sum: { delta: true },
    }),
    prisma.match.groupBy({
      by: ["winnerId"],
      where: { status: "COMPLETED", winnerId: { not: null } },
      _count: true,
    }),
  ]);

  const deltaMap = new Map(deltas.map((d) => [d.playerId, d._sum.delta ?? 0]));
  const winsMap = new Map(winCounts.map((w) => [w.winnerId, w._count]));

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">
          {tr("Leaderboard")}
        </h1>
        <p className="text-sm text-muted">
          {tr(
            "Elo-style ranking — every ranked frame counts. Beat above your weight to climb faster.",
          )}
        </p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/leaderboard?period=${p.key}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === p.key
                ? "border-emerald-accent bg-emerald-accent/15 text-emerald-bright"
                : "border-border text-muted hover:border-border-strong hover:text-foreground",
            )}
          >
            {tr(p.label)}
          </Link>
        ))}
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 items-end gap-3 sm:gap-5">
        {[podium[1], podium[0], podium[2]].map((p, i) => {
          if (!p) return <div key={i} />;
          const place = i === 1 ? 1 : i === 0 ? 2 : 3;
          return (
            <Card
              key={p.id}
              glass
              className={cn(
                "flex flex-col items-center gap-2 text-center",
                place === 1
                  ? "border-gold/50 pb-8 pt-6 shadow-lg shadow-gold/10"
                  : "pb-5 pt-4 opacity-95",
              )}
            >
              {place === 1 && <Crown className="h-6 w-6 text-gold" />}
              <Avatar
                name={p.user.name}
                src={p.user.avatarUrl}
                size={place === 1 ? "lg" : "md"}
                className={place === 1 ? "ring-gold/70" : ""}
              />
              <p
                className={cn(
                  "w-full truncate px-1 font-semibold",
                  place === 1 ? "text-base" : "text-sm",
                )}
              >
                {p.user.name}
              </p>
              <p
                className={cn(
                  "font-display tracking-wide",
                  place === 1
                    ? "text-3xl text-gold"
                    : "text-2xl text-emerald-bright",
                )}
              >
                {p.points.toLocaleString(locale)}
              </p>
              <span className="font-display text-xl text-faint">#{place}</span>
            </Card>
          );
        })}
      </div>

      {/* Table / cards */}
      <Card className="overflow-hidden p-0">
        <ol>
          {rest.map((p, i) => {
            const rank = i + 4;
            const delta = deltaMap.get(p.id) ?? 0;
            return (
              <li
                key={p.id}
                className="group relative flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-hover sm:gap-4 sm:px-6"
              >
                <span className="w-7 text-center font-display text-xl text-faint">
                  {rank}
                </span>
                <Avatar name={p.user.name} src={p.user.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {p.user.name}
                  </p>
                  <p className="text-xs text-muted">
                    {tr("Lv")} {p.level} · {winsMap.get(p.id) ?? 0} {tr("wins")}
                    <span className="hidden sm:inline">
                      {p.badges.length > 0 && " · "}
                      {p.badges.map((b) => b.badge.icon).join(" ")}
                    </span>
                  </p>
                </div>
                {p.trustBadge && (
                  <Badge variant="emerald" className="hidden sm:inline-flex">
                    {tr("trusted")}
                  </Badge>
                )}
                <span
                  className={cn(
                    "flex w-14 items-center justify-end gap-1 text-xs font-semibold",
                    delta > 0
                      ? "text-emerald-bright"
                      : delta < 0
                        ? "text-live"
                        : "text-faint",
                  )}
                >
                  {delta > 0 ? (
                    <TrendingUp size={13} />
                  ) : delta < 0 ? (
                    <TrendingDown size={13} />
                  ) : (
                    <Minus size={13} />
                  )}
                  {delta !== 0 && Math.abs(delta)}
                </span>
                <span className="w-16 text-end font-display text-xl text-emerald-bright">
                  {p.points.toLocaleString(locale)}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
