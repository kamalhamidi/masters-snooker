import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePlayerProfile, isStaffRole } from "@/lib/player";
import { getPlayerCoreStats, getRankPosition } from "@/lib/queries";
import { levelProgress } from "@/lib/points";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

const TIER_STYLE: Record<string, "default" | "emerald" | "gold" | "purple"> = {
  BRONZE: "default",
  SILVER: "emerald",
  GOLD: "gold",
  ELITE: "purple",
};

export default async function ProfilePage() {
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
    include: {
      user: true,
      badges: { include: { badge: true }, orderBy: { unlockedAt: "desc" }, take: 6 },
    },
  });
  const [stats, rank] = await Promise.all([
    getPlayerCoreStats(player.id),
    getRankPosition(player.points),
  ]);
  const lvl = levelProgress(player.xp);

  const profileFields = [player.user.avatarUrl, player.user.phone, player.bio];
  const completion = Math.round(
    ((profileFields.filter(Boolean).length + 2) / (profileFields.length + 2)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card glass className="p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar name={player.user.name} src={player.user.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-4xl tracking-wide">{player.user.name}</h1>
              {rank === 1 && <Crown className="text-gold" size={22} />}
            </div>
            <p className="mt-1 text-sm text-muted">{player.bio ?? "No bio yet — tell the club who you are."}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {player.trustBadge ? (
                <Badge variant="emerald"><ShieldCheck size={13} /> Trust badge — instant tournament entry</Badge>
              ) : (
                <Badge><ShieldAlert size={13} /> Tournament entries need staff approval</Badge>
              )}
              <Badge variant={TIER_STYLE[player.loyaltyTier]}>{player.loyaltyTier.toLowerCase()} tier</Badge>
              <Badge variant="gold">Rank #{rank}</Badge>
            </div>
          </div>
          <div className="text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-gold/40 bg-felt">
              <span className="font-display text-4xl text-gold">{lvl.level}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Level</p>
          </div>
        </div>
        {completion < 100 && (
          <div className="mt-5 rounded-xl border border-border bg-elevated/50 p-3">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted">Profile completion</span>
              <span className="font-semibold text-emerald-bright">{completion}%</span>
            </div>
            <Progress value={completion} />
          </div>
        )}
      </Card>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Played", value: stats.played },
          { label: "Won", value: stats.wins },
          { label: "Win rate", value: `${stats.winRate}%` },
          { label: "Points", value: player.points.toLocaleString() },
        ].map((s) => (
          <Card key={s.label} className="py-4 text-center">
            <p className="font-display text-3xl tracking-wide text-emerald-bright">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent badges */}
        <Card>
          <CardHeader>
            <CardTitle>Latest badges</CardTitle>
            <Link href="/achievements" className="text-sm text-emerald-bright hover:underline">
              Badge wall →
            </Link>
          </CardHeader>
          {player.badges.length === 0 ? (
            <p className="text-sm text-muted">No badges yet — your first win unlocks one.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {player.badges.map((pb) => (
                <div
                  key={pb.badgeId}
                  title={pb.badge.description}
                  className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 py-1.5 pl-2 pr-3.5"
                >
                  <span className="text-xl">{pb.badge.icon}</span>
                  <span className="text-sm font-medium text-gold-soft">{pb.badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Edit form */}
        <ProfileForm
          defaults={{
            name: player.user.name,
            phone: player.user.phone ?? "",
            bio: player.bio ?? "",
            avatarUrl: player.user.avatarUrl ?? "",
          }}
          hasBio
        />
      </div>
    </div>
  );
}
