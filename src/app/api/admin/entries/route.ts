import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  entryId: z.string(),
  action: z.enum(["approve", "reject"]),
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

  const entry = await prisma.tournamentEntry.findUnique({
    where: { id: parsed.data.entryId },
    include: {
      tournament: { select: { name: true, slug: true } },
      player: { select: { userId: true } },
    },
  });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const approved = parsed.data.action === "approve";
  await prisma.$transaction([
    prisma.tournamentEntry.update({
      where: { id: entry.id },
      data: { status: approved ? "APPROVED" : "REJECTED" },
    }),
    prisma.notification.create({
      data: {
        userId: entry.player.userId,
        type: approved ? "TOURNAMENT_ACCEPTED" : "TOURNAMENT_REJECTED",
        title: approved
          ? `Accepted: ${entry.tournament.name}`
          : `Not accepted: ${entry.tournament.name}`,
        body: approved
          ? "Your application was approved. Check the schedule and bring your cue!"
          : "Your application wasn't accepted this time. Entry fees are refunded at the front desk.",
        link: `/tournaments/${entry.tournament.slug}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
