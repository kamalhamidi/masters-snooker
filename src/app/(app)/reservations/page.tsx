import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePlayerProfile, isStaffRole } from "@/lib/player";
import { cn } from "@/lib/utils";
import { AvailabilityGrid } from "./availability-grid";
import { MyReservations } from "./my-reservations";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Reservations") };
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { tr, locale } = await getI18n();

  const session = await auth();
  if (!session) redirect("/login");

  const isStaff = isStaffRole(session.user.role);
  const selfPlayer = isStaff
    ? await ensurePlayerProfile(session.user.id, session.user.role)
    : session.user.playerId
      ? await prisma.player.findUnique({ where: { id: session.user.playerId } })
      : null;

  if (!selfPlayer) redirect("/login");

  const { date } = await searchParams;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
  const selected = days.find((d) => dateKey(d) === date) ?? days[0];

  const dayStart = new Date(selected);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selected);
  dayEnd.setHours(26, 0, 0, 0);

  const [tables, dayReservations, mine, allPlayers] = await Promise.all([
    prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart },
      },
      select: { tableId: true, startTime: true, endTime: true, playerId: true },
    }),
    prisma.reservation.findMany({
      where: { playerId: selfPlayer.id, endTime: { gte: new Date() } },
      include: { table: true },
      orderBy: { startTime: "asc" },
    }),
    isStaff
      ? prisma.player.findMany({
          include: { user: { select: { name: true } } },
          orderBy: { user: { name: "asc" } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display flex items-center gap-3 text-4xl tracking-wide">
          <CalendarClock className="text-emerald-bright" /> {tr("Book a table")}
        </h1>
        <p className="text-sm text-muted">
          {isStaff
            ? tr(
                "Book for yourself or any member — staff bookings are confirmed instantly.",
              )
            : tr(
                "Live availability, per table per hour. Bookings are confirmed by staff.",
              )}
        </p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {days.map((d) => {
          const key = dateKey(d);
          const isSelected = key === dateKey(selected);
          return (
            <Link
              key={key}
              href={`/reservations?date=${key}`}
              aria-current={isSelected ? "date" : undefined}
              aria-label={d.toLocaleDateString(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              className={cn(
                "flex min-w-[72px] shrink-0 flex-col items-center rounded-2xl border px-4 py-2.5 transition-colors",
                isSelected
                  ? "border-emerald-accent bg-emerald-accent/15 text-emerald-bright"
                  : "border-border text-muted hover:border-border-strong",
              )}
            >
              <span className="text-xs font-medium uppercase">
                {d.toLocaleDateString(locale, { weekday: "short" })}
              </span>
              <span className="font-display text-2xl">{d.getDate()}</span>
            </Link>
          );
        })}
      </div>

      <AvailabilityGrid
        key={dateKey(selected)}
        date={dateKey(selected)}
        isStaff={isStaff}
        selfPlayerId={selfPlayer.id}
        players={
          isStaff
            ? allPlayers.map((p) => ({
                id: p.id,
                name: p.user.name,
                isSelf: p.id === selfPlayer.id,
              }))
            : undefined
        }
        tables={tables.map((t) => ({
          id: t.id,
          name: t.name,
          number: t.number,
          hourlyRate: t.hourlyRate,
        }))}
        reservations={dayReservations.map((r) => ({
          tableId: r.tableId,
          start: r.startTime.toISOString(),
          end: r.endTime.toISOString(),
          mine: r.playerId === selfPlayer.id,
        }))}
      />

      <MyReservations
        reservations={mine.map((r) => ({
          id: r.id,
          tableName: r.table.name,
          start: r.startTime.toISOString(),
          end: r.endTime.toISOString(),
          status: r.status,
        }))}
      />
    </div>
  );
}
