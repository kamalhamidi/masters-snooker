import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  playerId: z.string(),
  trustBadge: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id: parsed.data.playerId },
    data: { trustBadge: parsed.data.trustBadge },
    select: { userId: true, trustBadge: true },
  });

  if (player.trustBadge) {
    await prisma.notification.create({
      data: {
        userId: player.userId,
        type: "GENERAL",
        title: "You've been awarded the club trust badge",
        body: "You can now enter tournaments without staff approval. Wear it well!",
        link: "/profile",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
