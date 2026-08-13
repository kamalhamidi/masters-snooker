import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubSettings } from "@/lib/club";
import { evaluateBadges } from "@/lib/badges";
import { tierForLoyaltyPoints } from "@/lib/points";

const schema = z.object({ code: z.string().min(4) });

/** Staff-side QR scan: verifies the player's token and records a check-in. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")) {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const token = parsed.data.code.replace(/^masters-checkin:/, "").trim();
  const player = await prisma.player.findUnique({
    where: { qrToken: token },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  if (!player) {
    return NextResponse.json({ error: "Unknown QR code" }, { status: 404 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const already = await prisma.checkIn.findFirst({
    where: { playerId: player.id, createdAt: { gte: startOfDay } },
  });
  if (already) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      player: { name: player.user.name, level: player.level },
    });
  }

  const settings = await getClubSettings();
  const lifetimeEarned = await prisma.loyaltyTransaction.aggregate({
    where: { playerId: player.id, type: "EARN" },
    _sum: { delta: true },
  });
  const newLifetime = (lifetimeEarned._sum.delta ?? 0) + settings.loyaltyPerVisit;

  await prisma.$transaction([
    prisma.checkIn.create({
      data: { playerId: player.id, byEmployeeId: session.user.employeeId },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: {
        checkedInAt: new Date(),
        loyaltyPoints: { increment: settings.loyaltyPerVisit },
        loyaltyTier: tierForLoyaltyPoints(newLifetime),
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        playerId: player.id,
        type: "EARN",
        delta: settings.loyaltyPerVisit,
        reason: "Club visit check-in",
      },
    }),
    prisma.notification.create({
      data: {
        userId: player.user.id,
        type: "GENERAL",
        title: "Checked in — welcome!",
        body: `+${settings.loyaltyPerVisit} loyalty points for today's visit. Enjoy your session!`,
        link: "/loyalty",
      },
    }),
  ]);

  await evaluateBadges(player.id);

  return NextResponse.json({
    ok: true,
    player: {
      name: player.user.name,
      level: player.level,
      avatarUrl: player.user.avatarUrl,
      trustBadge: player.trustBadge,
    },
  });
}
