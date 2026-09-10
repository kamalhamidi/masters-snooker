import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gift, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOYALTY_TIERS } from "@/lib/points";
import { cn, timeAgo } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCounter } from "@/components/ui/stat-counter";
import { RedeemButton } from "./redeem-button";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Loyalty & rewards") };
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "text-amber-600",
  SILVER: "text-slate-300",
  GOLD: "text-gold",
  ELITE: "text-violet-400",
};

export default async function LoyaltyPage() {
  const { tr, locale } = await getI18n();

  const session = await auth();
  if (!session?.user.playerId) redirect("/login");

  const [player, rewards, transactions, lifetime] = await Promise.all([
    prisma.player.findUniqueOrThrow({ where: { id: session.user.playerId } }),
    prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { cost: "asc" },
    }),
    prisma.loyaltyTransaction.findMany({
      where: { playerId: session.user.playerId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.loyaltyTransaction.aggregate({
      where: { playerId: session.user.playerId, type: "EARN" },
      _sum: { delta: true },
    }),
  ]);

  const lifetimeEarned = lifetime._sum.delta ?? 0;
  const tierIdx = LOYALTY_TIERS.findIndex((t) => t.tier === player.loyaltyTier);
  const nextTier = LOYALTY_TIERS[tierIdx + 1];
  const tierPct = nextTier
    ? Math.min(100, Math.round((lifetimeEarned / nextTier.min) * 100))
    : 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display flex items-center gap-3 text-4xl tracking-wide">
          <Gift className="text-gold" /> {tr("Loyalty & rewards")}
        </h1>
        <p className="text-sm text-muted">
          {tr(
            "Earn points every visit, match and booking. Spend them on real perks.",
          )}
        </p>
      </div>

      {/* Balance + tier */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card
          glass
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <p className="text-sm text-muted">{tr("Available balance")}</p>
          <p className="font-display text-6xl tracking-wide text-gold">
            <StatCounter value={player.loyaltyPoints} />
          </p>
          <p className="text-sm text-muted">{tr("points")}</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle
              className={cn("capitalize", TIER_COLORS[player.loyaltyTier])}
            >
              {tr(player.loyaltyTier)} {tr("tier")}
            </CardTitle>
            <Sparkles size={18} className={TIER_COLORS[player.loyaltyTier]} />
          </CardHeader>
          <p className="mb-4 text-sm text-muted">
            {tr(LOYALTY_TIERS[tierIdx].perk)}
          </p>
          {nextTier ? (
            <>
              <Progress
                value={tierPct}
                barClassName="bg-gradient-to-r from-gold to-gold-soft"
              />
              <p className="mt-2 text-xs text-muted">
                {lifetimeEarned.toLocaleString(locale)} /{" "}
                {nextTier.min.toLocaleString(locale)} {tr("lifetime points to")}{" "}
                <span className="font-semibold capitalize">
                  {tr(nextTier.tier)}
                </span>
              </p>
            </>
          ) : (
            <Badge variant="purple">{tr("Top tier — enjoy the perks")}</Badge>
          )}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {LOYALTY_TIERS.map((t, i) => (
              <div
                key={t.tier}
                className={cn(
                  "rounded-lg border px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide",
                  i <= tierIdx
                    ? "border-gold/40 bg-gold/10 text-gold-soft"
                    : "border-border text-faint",
                )}
              >
                {tr(t.tier)}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Rewards catalog */}
      <section>
        <h2 className="mb-4 font-display text-2xl tracking-wide">
          {tr("Rewards catalog")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => {
            const affordable = player.loyaltyPoints >= r.cost;
            return (
              <Card
                key={r.id}
                className={cn(
                  "flex flex-col transition-all",
                  affordable && "hover:-translate-y-1 hover:border-gold/40",
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-xl">
                    🎁
                  </span>
                  <Badge variant={affordable ? "gold" : "default"}>
                    {r.cost} {tr("pts")}
                  </Badge>
                </div>
                <p className="font-semibold">{tr(r.name)}</p>
                <p className="mb-4 mt-1 text-sm text-muted">
                  {tr(r.description)}
                </p>
                <div className="mt-auto">
                  <RedeemButton rewardId={r.id} affordable={affordable} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-4 font-display text-2xl tracking-wide">
          {tr("Points history")}
        </h2>
        <Card className="divide-y divide-border p-0">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tr(t.reason)}</p>
                <p className="text-xs text-faint">
                  {timeAgo(t.createdAt, locale)}
                </p>
              </div>
              <span
                className={cn(
                  "font-display text-xl",
                  t.delta > 0 ? "text-emerald-bright" : "text-live",
                )}
              >
                {t.delta > 0 ? "+" : ""}
                {t.delta}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
