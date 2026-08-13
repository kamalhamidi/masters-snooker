import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  isLive: z.boolean().optional(),
  streamUrl: z.string().url().optional().or(z.literal("")),
  streamTitle: z.string().max(120).optional().or(z.literal("")),
  streamPlatform: z.enum(["youtube", "twitch"]).optional(),
  loyaltyPerMatch: z.number().int().min(0).max(1000).optional(),
  loyaltyPerVisit: z.number().int().min(0).max(1000).optional(),
  loyaltyPerReservation: z.number().int().min(0).max(1000).optional(),
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
  const d = parsed.data;

  const data = {
    ...(d.isLive !== undefined ? { isLive: d.isLive } : {}),
    ...(d.streamUrl !== undefined ? { streamUrl: d.streamUrl || null } : {}),
    ...(d.streamTitle !== undefined ? { streamTitle: d.streamTitle || null } : {}),
    ...(d.streamPlatform ? { streamPlatform: d.streamPlatform } : {}),
    ...(d.loyaltyPerMatch !== undefined ? { loyaltyPerMatch: d.loyaltyPerMatch } : {}),
    ...(d.loyaltyPerVisit !== undefined ? { loyaltyPerVisit: d.loyaltyPerVisit } : {}),
    ...(d.loyaltyPerReservation !== undefined
      ? { loyaltyPerReservation: d.loyaltyPerReservation }
      : {}),
  };

  await prisma.clubSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
