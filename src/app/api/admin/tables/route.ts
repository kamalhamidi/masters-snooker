import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createTableSchema = z.object({
  number: z.coerce.number().int().positive("Table number must be positive"),
  name: z.string().trim().min(1, "Table name is required").max(100),
  hourlyRate: z.coerce.number().int().min(0, "Hourly rate cannot be negative"), // in cents
  typeId: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateTableSchema = z.object({
  id: z.string().min(1, "Table ID is required"),
  number: z.coerce.number().int().positive("Table number must be positive"),
  name: z.string().trim().min(1, "Table name is required").max(100),
  hourlyRate: z.coerce.number().int().min(0, "Hourly rate cannot be negative"), // in cents
  typeId: z.string().trim().optional().nullable(),
  isActive: z.boolean(),
});

const patchTableSchema = z.object({
  id: z.string().min(1, "Table ID is required"),
  isActive: z.boolean(),
});

const deleteTableSchema = z.object({
  id: z.string().min(1, "Table ID is required"),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const tables = await prisma.table.findMany({
    include: {
      type: true,
      _count: {
        select: {
          matches: true,
          reservations: true,
        },
      },
    },
    orderBy: { number: "asc" },
  });

  return NextResponse.json({ tables });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = createTableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { number, name, hourlyRate, typeId, isActive } = parsed.data;

  // Check unique table number
  const exists = await prisma.table.findUnique({
    where: { number },
  });
  if (exists) {
    return NextResponse.json(
      { error: `Table number ${number} is already in use` },
      { status: 409 },
    );
  }

  // Validate typeId if provided
  if (typeId) {
    const valid = await prisma.tableType.findUnique({ where: { id: typeId } });
    if (!valid) {
      return NextResponse.json(
        { error: "Selected table type does not exist" },
        { status: 400 },
      );
    }
  }

  const table = await prisma.table.create({
    data: {
      number,
      name,
      hourlyRate,
      typeId: typeId || null,
      isActive,
    },
    include: {
      type: true,
    },
  });

  return NextResponse.json({ table }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = updateTableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { id, number, name, hourlyRate, typeId, isActive } = parsed.data;

  // Check unique table number conflict
  const conflict = await prisma.table.findFirst({
    where: {
      number,
      id: { not: id },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: `Table number ${number} is already in use by another table` },
      { status: 409 },
    );
  }

  // Validate typeId if provided
  if (typeId) {
    const valid = await prisma.tableType.findUnique({ where: { id: typeId } });
    if (!valid) {
      return NextResponse.json(
        { error: "Selected table type does not exist" },
        { status: 400 },
      );
    }
  }

  const table = await prisma.table.update({
    where: { id },
    data: {
      number,
      name,
      hourlyRate,
      typeId: typeId || null,
      isActive,
    },
    include: {
      type: true,
    },
  });

  return NextResponse.json({ table });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = patchTableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { id, isActive } = parsed.data;

  const table = await prisma.table.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ table });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = deleteTableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { id } = parsed.data;

  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          matches: true,
          reservations: true,
        },
      },
    },
  });

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  // If table has matches or reservations, advise disabling instead of deleting
  if (table._count.matches > 0 || table._count.reservations > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete this table because it has match or booking history. You can mark it as Inactive instead.",
      },
      { status: 400 },
    );
  }

  await prisma.table.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
