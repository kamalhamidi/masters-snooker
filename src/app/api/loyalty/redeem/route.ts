import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ rewardId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.playerId) {
    return NextResponse.json({ error: "Players only" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [reward, player] = await Promise.all([
    prisma.reward.findUnique({ where: { id: parsed.data.rewardId } }),
    prisma.player.findUniqueOrThrow({ where: { id: session.user.playerId } }),
  ]);

  if (!reward || !reward.isActive) {
    return NextResponse.json({ error: "Reward unavailable" }, { status: 404 });
  }
  if (player.loyaltyPoints < reward.cost) {
    return NextResponse.json(
      { error: `You need ${reward.cost - player.loyaltyPoints} more points` },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.player.update({
      where: { id: player.id },
      data: { loyaltyPoints: { decrement: reward.cost } },
    }),
    prisma.rewardRedemption.create({
      data: { playerId: player.id, rewardId: reward.id },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        playerId: player.id,
        type: "REDEEM",
        delta: -reward.cost,
        reason: `Redeemed: ${reward.name}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "LOYALTY_REWARD",
        title: "Reward redeemed!",
        body: `${reward.name} — show this notification at the front desk to claim it.`,
        link: "/loyalty",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
