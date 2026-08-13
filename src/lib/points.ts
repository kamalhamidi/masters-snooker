import type { MatchType } from "@prisma/client";

/**
 * Elo-inspired scoring engine.
 *
 * Each player has a rating ("points", starts at 1000). When a rated match
 * completes, the winner takes points from the loser weighted by:
 *   - the K-factor of the match type (championship > tournament > ranked)
 *   - the expected outcome: beating a stronger opponent pays more.
 *
 * Friendly matches never move ratings.
 */
export const K_FACTOR: Record<MatchType, number> = {
  FRIENDLY: 0,
  RANKED: 24,
  TOURNAMENT: 32,
  CHAMPIONSHIP: 40,
};

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function computePointsExchange(
  winnerRating: number,
  loserRating: number,
  type: MatchType
): { winnerDelta: number; loserDelta: number } {
  const k = K_FACTOR[type];
  if (k === 0) return { winnerDelta: 0, loserDelta: 0 };
  const expected = expectedScore(winnerRating, loserRating);
  const winnerDelta = Math.max(1, Math.round(k * (1 - expected)));
  return { winnerDelta, loserDelta: -winnerDelta };
}

/**
 * XP drives player level, independent of the competitive rating.
 * Winners earn more; upsets (beating a higher-level player) pay a bonus.
 */
export function computeXp(
  won: boolean,
  ownLevel: number,
  opponentLevel: number,
  type: MatchType
): number {
  const base = won ? 100 : 30;
  const typeMultiplier =
    type === "CHAMPIONSHIP" ? 2 : type === "TOURNAMENT" ? 1.5 : type === "RANKED" ? 1 : 0.5;
  const upsetBonus = won && opponentLevel > ownLevel ? (opponentLevel - ownLevel) * 25 : 0;
  return Math.round(base * typeMultiplier + upsetBonus);
}

/** Level curve: level n requires 150·n² cumulative XP. Level 1 at 0 XP. */
export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 150)) + 1);
}

export function xpForLevel(level: number): number {
  return 150 * Math.pow(level - 1, 2);
}

export function levelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  pct: number;
} {
  const level = levelForXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const pct = Math.min(
    100,
    Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
  );
  return { level, currentLevelXp, nextLevelXp, pct };
}

export const LOYALTY_TIERS = [
  { tier: "BRONZE", min: 0, perk: "Member pricing on table time" },
  { tier: "SILVER", min: 500, perk: "5% off reservations + priority booking" },
  { tier: "GOLD", min: 1500, perk: "10% off + free cue rental + guest passes" },
  { tier: "ELITE", min: 4000, perk: "15% off + reserved locker + VIP events" },
] as const;

export function tierForLoyaltyPoints(lifetimeEarned: number) {
  let current: (typeof LOYALTY_TIERS)[number] = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) {
    if (lifetimeEarned >= t.min) current = t;
  }
  return current.tier;
}
