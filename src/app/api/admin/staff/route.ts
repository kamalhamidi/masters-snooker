import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  position: z.string().min(2).max(60),
});

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, password, position } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: "EMPLOYEE",
      employee: { create: { position } },
      player: { create: { bio: "Club staff & player." } },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

const deleteSchema = z.object({ userId: z.string() });

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: "You can't remove yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { employee: true },
  });
  if (!user?.employee || user.role === "CHEF") {
    return NextResponse.json({ error: "Not a removable employee" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
