import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const typeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(300).optional().nullable(),
});

const updateSchema = typeSchema.extend({
  id: z.string().min(1, "Type ID is required"),
});

const deleteSchema = z.object({
  id: z.string().min(1, "Type ID is required"),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const types = await prisma.tableType.findMany({
    include: {
      _count: { select: { tables: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ types });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = typeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;

  const existing = await prisma.tableType.findUnique({
    where: { name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A table type with this name already exists" },
      { status: 409 },
    );
  }

  const created = await prisma.tableType.create({
    data: {
      name,
      description: description || null,
    },
  });

  return NextResponse.json({ type: created }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { id, name, description } = parsed.data;

  // Check if name is taken by another type
  const conflict = await prisma.tableType.findFirst({
    where: {
      name,
      id: { not: id },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: "Another table type already has this name" },
      { status: 409 },
    );
  }

  const updated = await prisma.tableType.update({
    where: { id },
    data: {
      name,
      description: description || null,
    },
  });

  return NextResponse.json({ type: updated });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { id } = parsed.data;

  await prisma.tableType.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
