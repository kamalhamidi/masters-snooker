import { prisma } from "@/lib/prisma";

export const BADGE_DEFS = [
  { code: "first_victory", name: "First Victory", description: "Win your first match", icon: "🏆", category: "milestone", xpReward: 100 },
  { code: "wins_10", name: "Ten Wins", description: "Win 10 matches", icon: "🎯", category: "milestone", xpReward: 200 },
  { code: "wins_50", name: "Half Century", description: "Win 50 matches", icon: "⭐", category: "milestone", xpReward: 500 },
  { code: "matches_100", name: "Centurion", description: "Play 100 matches", icon: "💯", category: "milestone", xpReward: 500 },
  { code: "streak_5", name: "On Fire", description: "Win 5 matches in a row", icon: "🔥", category: "streak", xpReward: 300 },
  { code: "giant_slayer", name: "Giant Slayer", description: "Beat a player 3+ levels above you", icon: "⚔️", category: "skill", xpReward: 400 },
  { code: "champion", name: "Champion", description: "Win a tournament", icon: "👑", category: "tournament", xpReward: 1000 },
  { code: "regular", name: "Club Regular", description: "Check in 20 times", icon: "🎱", category: "loyalty", xpReward: 200 },
  { code: "night_owl", name: "Night Owl", description: "Play a match after 10 PM", icon: "🦉", category: "fun", xpReward: 100 },
  { code: "socialite", name: "Socialite", description: "Play against 10 different opponents", icon: "🤝", category: "fun", xpReward: 250 },
] as const;

export type BadgeCode = (typeof BADGE_DEFS)[number]["code"];

async function playerStats(playerId: string) {
  const [wins, played, distinctOpponents] = await Promise.all([
    prisma.match.count({ where: { winnerId: playerId, status: "COMPLETED" } }),
    prisma.match.count({
      where: {
        status: "COMPLETED",
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
    }),
    prisma.match.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      select: { player1Id: true, player2Id: true },
    }),
  ]);
  const opponents = new Set(
    distinctOpponents.map((m) => (m.player1Id === playerId ? m.player2Id : m.player1Id))
  );
  return { wins, played, opponentCount: opponents.size };
}

async function currentWinStreak(playerId: string): Promise<number> {
  const recent = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
    },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: { winnerId: true },
  });
  let streak = 0;
  for (const m of recent) {
    if (m.winnerId === playerId) streak++;
    else break;
  }
  return streak;
}

/**
 * Evaluate and award any newly-earned badges for a player.
 * Returns the list of badges unlocked in this pass (used to fire
 * notifications and the celebration animation client-side).
 */
export async function evaluateBadges(playerId: string): Promise<string[]> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { badges: { include: { badge: true } }, user: true },
  });
  if (!player) return [];

  const owned = new Set(player.badges.map((b) => b.badge.code));
  const { wins, played, opponentCount } = await playerStats(playerId);
  const streak = await currentWinStreak(playerId);
  const checkIns = await prisma.checkIn.count({ where: { playerId } });
  const tournamentWins = await prisma.tournament.count({ where: { winnerId: playerId } });

  const earned: string[] = [];
  const check = (code: BadgeCode, condition: boolean) => {
    if (condition && !owned.has(code)) earned.push(code);
  };

  check("first_victory", wins >= 1);
  check("wins_10", wins >= 10);
  check("wins_50", wins >= 50);
  check("matches_100", played >= 100);
  check("streak_5", streak >= 5);
  check("champion", tournamentWins >= 1);
  check("regular", checkIns >= 20);
  check("socialite", opponentCount >= 10);

  if (earned.length === 0) return [];

  const badges = await prisma.badge.findMany({ where: { code: { in: earned } } });
  const totalXp = badges.reduce((s, b) => s + b.xpReward, 0);

  await prisma.$transaction([
    prisma.playerBadge.createMany({
      data: badges.map((b) => ({ playerId, badgeId: b.id })),
      skipDuplicates: true,
    }),
    prisma.player.update({
      where: { id: playerId },
      data: { xp: { increment: totalXp } },
    }),
    prisma.notification.createMany({
      data: badges.map((b) => ({
        userId: player.userId,
        type: "BADGE_EARNED" as const,
        title: `Badge unlocked: ${b.name}`,
        body: `${b.icon} ${b.description} (+${b.xpReward} XP)`,
        link: "/achievements",
      })),
    }),
  ]);

  return badges.map((b) => b.name);
}
