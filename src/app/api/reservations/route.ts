import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePlayerProfile, isStaffRole } from "@/lib/player";

const createSchema = z.object({
  tableId: z.string(),
  startTime: z.string().datetime(),
  hours: z.number().int().min(1).max(3),
  /** Staff only — book on behalf of another player. Omit to book for yourself. */
  playerId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const isStaff = isStaffRole(session.user.role);
  let targetPlayerId = session.user.playerId;

  if (isStaff) {
    const self = await ensurePlayerProfile(session.user.id, session.user.role);
    targetPlayerId = parsed.data.playerId ?? self.id;
  } else if (!targetPlayerId) {
    return NextResponse.json({ error: "Player profile required" }, { status: 401 });
  }

  const targetPlayer = await prisma.player.findUnique({
    where: { id: targetPlayerId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!targetPlayer) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const start = new Date(parsed.data.startTime);
  const end = new Date(start.getTime() + parsed.data.hours * 3600 * 1000);

  if (start < new Date()) {
    return NextResponse.json({ error: "Cannot book in the past" }, { status: 400 });
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      tableId: parsed.data.tableId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: "That slot was just taken — pick another." },
      { status: 409 }
    );
  }

  const bookingForOther = isStaff && targetPlayerId !== session.user.playerId;
  const status = isStaff ? "CONFIRMED" : "PENDING";

  const reservation = await prisma.reservation.create({
    data: {
      playerId: targetPlayerId,
      tableId: parsed.data.tableId,
      startTime: start,
      endTime: end,
      status,
      ...(isStaff && session.user.employeeId
        ? { managedById: session.user.employeeId }
        : {}),
    },
    include: { table: true },
  });

  const when = start.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await prisma.notification.create({
    data: {
      userId: targetPlayer.user.id,
      type: status === "CONFIRMED" ? "RESERVATION_CONFIRMED" : "RESERVATION_REMINDER",
      title:
        status === "CONFIRMED"
          ? bookingForOther
            ? "Table booked for you"
            : "Reservation confirmed"
          : "Reservation requested",
      body:
        status === "CONFIRMED"
          ? `${reservation.table.name} on ${when}${bookingForOther ? ` — booked by ${session.user.name}` : ""}.`
          : `${reservation.table.name} on ${when} — pending staff confirmation.`,
      link: "/reservations",
    },
  });

  return NextResponse.json({ ok: true, reservation, status }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(["cancel", "confirm", "complete"]),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.id },
    include: { player: { select: { userId: true } }, table: true },
  });
  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isStaff = isStaffRole(session.user.role);
  const isOwner = reservation.playerId === session.user.playerId;

  if (parsed.data.action === "cancel" && !isStaff && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (parsed.data.action !== "cancel" && !isStaff) {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }

  const status =
    parsed.data.action === "cancel"
      ? "CANCELLED"
      : parsed.data.action === "confirm"
        ? "CONFIRMED"
        : "COMPLETED";

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status,
      ...(isStaff && session.user.employeeId
        ? { managedById: session.user.employeeId }
        : {}),
    },
  });

  if (parsed.data.action === "confirm") {
    await prisma.notification.create({
      data: {
        userId: reservation.player.userId,
        type: "RESERVATION_CONFIRMED",
        title: "Reservation confirmed",
        body: `${reservation.table.name} — ${reservation.startTime.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}. See you there!`,
        link: "/reservations",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
