import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  matchId: z.string(),
  serviceStars: z.number().int().min(1).max(5),
  tableStars: z.number().int().min(1).max(5),
  overallStars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { matchId, ...data } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== "COMPLETED") {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  const playerId = session.user.playerId;
  if (match.player1Id !== playerId && match.player2Id !== playerId) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 });
  }

  const rating = await prisma.rating.upsert({
    where: { matchId_playerId: { matchId, playerId } },
    create: {
      matchId,
      playerId,
      employeeId: match.managedById,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({ ok: true, rating });
}
