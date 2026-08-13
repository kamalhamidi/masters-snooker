import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BadgeWall, type WallBadge } from "@/components/features/badge-wall";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ celebrate?: string }>;
}) {
  const session = await auth();
  if (!session?.user.playerId) redirect("/login");
  const { celebrate } = await searchParams;

  const [allBadges, playerBadges] = await Promise.all([
    prisma.badge.findMany({ orderBy: { xpReward: "asc" } }),
    prisma.playerBadge.findMany({
      where: { playerId: session.user.playerId },
      select: { badgeId: true, unlockedAt: true },
    }),
  ]);

  const unlockedMap = new Map(playerBadges.map((b) => [b.badgeId, b.unlockedAt]));
  const badges: WallBadge[] = allBadges.map((b) => ({
    ...b,
    unlockedAt: unlockedMap.get(b.id)?.toISOString() ?? null,
  }));
  const unlockedCount = playerBadges.length;
  const pct = Math.round((unlockedCount / allBadges.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Achievements</h1>
        <p className="text-sm text-muted">
          Earn badges by playing, winning and showing up. Each unlock pays XP.
        </p>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">
            {unlockedCount} of {allBadges.length} unlocked
          </span>
          <span className="text-gold">{pct}%</span>
        </div>
        <Progress value={pct} barClassName="bg-gradient-to-r from-gold to-gold-soft" />
      </Card>

      <BadgeWall badges={badges} celebrate={celebrate === "1"} />
    </div>
  );
}
