import { prisma } from "@/lib/prisma";

/** Ranking position = 1 + number of players with strictly more points. */
export async function getRankPosition(points: number): Promise<number> {
  const above = await prisma.player.count({ where: { points: { gt: points } } });
  return above + 1;
}

export async function getPlayerCoreStats(playerId: string) {
  const [wins, played, live] = await Promise.all([
    prisma.match.count({ where: { winnerId: playerId, status: "COMPLETED" } }),
    prisma.match.count({
      where: {
        status: "COMPLETED",
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
    }),
    prisma.match.count({
      where: {
        status: { in: ["LIVE", "SCHEDULED"] },
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
    }),
  ]);
  const losses = played - wins;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
  return { wins, losses, played, winRate, upcoming: live };
}

export async function getPointsSeries(playerId: string, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await prisma.pointsHistory.findMany({
    where: { playerId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, newTotal: true },
  });
  return rows.map((r) => ({
    date: r.createdAt.toISOString().slice(0, 10),
    points: r.newTotal,
  }));
}

export const matchInclude = {
  player1: { include: { user: { select: { name: true, avatarUrl: true } } } },
  player2: { include: { user: { select: { name: true, avatarUrl: true } } } },
  table: true,
  tournament: { select: { name: true, slug: true } },
  managedBy: { include: { user: { select: { name: true } } } },
} as const;
