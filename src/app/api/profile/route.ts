import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, phone, bio, avatarUrl } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
  });

  if (bio !== undefined && session.user.playerId) {
    await prisma.player.update({
      where: { id: session.user.playerId },
      data: { bio: bio || null },
    });
  }

  return NextResponse.json({ ok: true });
}
