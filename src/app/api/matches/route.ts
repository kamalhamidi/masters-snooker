import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePointsExchange, computeXp, levelForXp } from "@/lib/points";
import { evaluateBadges } from "@/lib/badges";
import { getClubSettings } from "@/lib/club";

const createSchema = z.object({
  player1Id: z.string(),
  player2Id: z.string(),
  type: z.enum(["FRIENDLY", "RANKED", "TOURNAMENT", "CHAMPIONSHIP"]),
  tableId: z.string(),
  frames: z.number().int().min(1).max(35).default(3),
  scheduledAt: z.string().datetime().optional(),
  tournamentId: z.string().optional(),
  round: z.string().max(40).optional(),
});

/** Staff create a match between two registered players. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")) {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;
  if (data.player1Id === data.player2Id) {
    return NextResponse.json({ error: "Pick two different players" }, { status: 400 });
  }

  const players = await prisma.player.findMany({
    where: { id: { in: [data.player1Id, data.player2Id] } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (players.length !== 2) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const match = await prisma.match.create({
    data: {
      player1Id: data.player1Id,
      player2Id: data.player2Id,
      type: data.type,
      tableId: data.tableId,
      frames: data.frames,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
      tournamentId: data.tournamentId,
      round: data.round,
      managedById: session.user.employeeId,
      status: "SCHEDULED",
    },
  });

  await prisma.notification.createMany({
    data: players.map((p) => ({
      userId: p.user.id,
      type: "MATCH_ASSIGNED" as const,
      title: "Match scheduled",
      body: `${players[0].user.name} vs ${players[1].user.name} — ${data.type.toLowerCase()} match. Check your dashboard for details.`,
      link: "/matches",
    })),
  });

  return NextResponse.json({ ok: true, match }, { status: 201 });
}

const resultSchema = z.object({
  matchId: z.string(),
  score1: z.number().int().min(0).max(35),
  score2: z.number().int().min(0).max(35),
  status: z.enum(["LIVE", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
});

/**
 * Staff enter/update a result. On completion:
 *  - Elo points exchange (weighted by match type; friendlies exempt)
 *  - XP + level recalculation (upset bonus for beating higher levels)
 *  - loyalty points for both players
 *  - badge evaluation + notifications
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")) {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }

  const parsed = resultSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { matchId, score1, score2, status } = parsed.data;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      player1: { include: { user: { select: { id: true, name: true } } } },
      player2: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status === "COMPLETED") {
    return NextResponse.json({ error: "Match already completed" }, { status: 400 });
  }

  // Live score update or cancellation — no scoring side effects
  if (status !== "COMPLETED") {
    await prisma.match.update({
      where: { id: matchId },
      data: { score1, score2, status },
    });
    return NextResponse.json({ ok: true });
  }

  if (score1 === score2) {
    return NextResponse.json({ error: "Snooker has no draws — enter a winner" }, { status: 400 });
  }

  const p1Won = score1 > score2;
  const winner = p1Won ? match.player1 : match.player2;
  const loser = p1Won ? match.player2 : match.player1;

  const { winnerDelta, loserDelta } = computePointsExchange(
    winner.points,
    loser.points,
    match.type
  );
  const xpWinner = computeXp(true, winner.level, loser.level, match.type);
  const xpLoser = computeXp(false, loser.level, winner.level, match.type);

  const settings = await getClubSettings();

  const winnerNewPoints = winner.points + winnerDelta;
  const loserNewPoints = loser.points + loserDelta;

  const tx: Prisma.PrismaPromise<unknown>[] = [
    prisma.match.update({
      where: { id: matchId },
      data: {
        score1,
        score2,
        status: "COMPLETED",
        winnerId: winner.id,
        completedAt: new Date(),
        managedById: match.managedById ?? session.user.employeeId,
      },
    }),
    prisma.player.update({
      where: { id: winner.id },
      data: {
        points: winnerNewPoints,
        xp: { increment: xpWinner },
        level: levelForXp(winner.xp + xpWinner),
        loyaltyPoints: { increment: settings.loyaltyPerMatch },
      },
    }),
    prisma.player.update({
      where: { id: loser.id },
      data: {
        points: loserNewPoints,
        xp: { increment: xpLoser },
        level: levelForXp(loser.xp + xpLoser),
        loyaltyPoints: { increment: settings.loyaltyPerMatch },
      },
    }),
    prisma.loyaltyTransaction.createMany({
      data: [winner.id, loser.id].map((pid) => ({
        playerId: pid,
        type: "EARN" as const,
        delta: settings.loyaltyPerMatch,
        reason: `Played a ${match.type.toLowerCase()} match`,
      })),
    }),
    prisma.notification.createMany({
      data: [
        {
          userId: winner.user.id,
          type: "MATCH_RESULT" as const,
          title: `Victory! ${score1 > score2 ? `${score1}–${score2}` : `${score2}–${score1}`} vs ${loser.user.name}`,
          body:
            winnerDelta > 0
              ? `+${winnerDelta} ranking points, +${xpWinner} XP. Keep the streak going!`
              : `Friendly match — no ranking change. +${xpWinner} XP for playing.`,
          link: "/matches",
        },
        {
          userId: loser.user.id,
          type: "MATCH_RESULT" as const,
          title: `Tough one vs ${winner.user.name}`,
          body:
            loserDelta < 0
              ? `${loserDelta} ranking points, +${xpLoser} XP. Win it back on the table.`
              : `Friendly match — no ranking change. +${xpLoser} XP for playing.`,
          link: "/matches",
        },
        {
          userId: winner.user.id,
          type: "RATING_REQUEST" as const,
          title: "Rate your match experience",
          body: "How were the table, the service and the overall session?",
          link: "/matches",
        },
        {
          userId: loser.user.id,
          type: "RATING_REQUEST" as const,
          title: "Rate your match experience",
          body: "How were the table, the service and the overall session?",
          link: "/matches",
        },
      ],
    }),
  ];

  if (match.type !== "FRIENDLY") {
    tx.push(
      prisma.pointsHistory.createMany({
        data: [
          {
            playerId: winner.id,
            matchId,
            delta: winnerDelta,
            newTotal: winnerNewPoints,
            xpDelta: xpWinner,
            reason: `Won ${match.type.toLowerCase()} match vs ${loser.user.name}`,
          },
          {
            playerId: loser.id,
            matchId,
            delta: loserDelta,
            newTotal: loserNewPoints,
            xpDelta: xpLoser,
            reason: `Lost ${match.type.toLowerCase()} match vs ${winner.user.name}`,
          },
        ],
      })
    );
  }

  await prisma.$transaction(tx);

  // Badge evaluation after the transaction lands
  await Promise.all([evaluateBadges(winner.id), evaluateBadges(loser.id)]);

  return NextResponse.json({
    ok: true,
    result: { winner: winner.user.name, winnerDelta, loserDelta, xpWinner, xpLoser },
  });
}
