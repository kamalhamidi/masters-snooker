import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, QrCode, ClipboardList, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchInclude } from "@/lib/queries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCounter } from "@/components/ui/stat-counter";
import { MatchRow } from "@/components/features/match-row";
import { EnterResultButton } from "./enter-result-button";
import { StaffReservationList } from "./reservation-list";

export const metadata: Metadata = { title: "Staff desk" };

export default async function StaffPage() {
  const session = await auth();
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")) {
    redirect("/dashboard");
  }

  const employeeId = session.user.employeeId!;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [openMatches, pendingReservations, managedCount, todayCheckIns, myRating] =
    await Promise.all([
      prisma.match.findMany({
        where: { status: { in: ["SCHEDULED", "LIVE"] } },
        include: matchInclude,
        orderBy: { scheduledAt: "asc" },
        take: 12,
      }),
      prisma.reservation.findMany({
        where: { status: "PENDING", endTime: { gte: new Date() } },
        include: {
          player: { include: { user: { select: { name: true, avatarUrl: true } } } },
          table: true,
        },
        orderBy: { startTime: "asc" },
        take: 10,
      }),
      prisma.match.count({ where: { managedById: employeeId, status: "COMPLETED" } }),
      prisma.checkIn.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.rating.aggregate({
        where: { employeeId },
        _avg: { serviceStars: true },
        _count: true,
      }),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Staff desk</h1>
          <p className="text-sm text-muted">
            Run matches, confirm bookings and check players in.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/staff/scan">
            <Button variant="secondary"><QrCode size={16} /> Scan check-in</Button>
          </Link>
          <Link href="/staff/matches/new">
            <Button><PlusCircle size={16} /> New match</Button>
          </Link>
        </div>
      </div>

      {/* My performance */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4 text-center">
          <ClipboardList className="mx-auto mb-1.5 h-5 w-5 text-emerald-bright" />
          <p className="font-display text-3xl"><StatCounter value={managedCount} /></p>
          <p className="text-xs text-muted">Matches managed</p>
        </Card>
        <Card className="py-4 text-center">
          <QrCode className="mx-auto mb-1.5 h-5 w-5 text-emerald-bright" />
          <p className="font-display text-3xl"><StatCounter value={todayCheckIns} /></p>
          <p className="text-xs text-muted">Check-ins today</p>
        </Card>
        <Card className="py-4 text-center">
          <Star className="mx-auto mb-1.5 h-5 w-5 text-gold" />
          <p className="font-display text-3xl">
            {myRating._avg.serviceStars ? myRating._avg.serviceStars.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted">Service rating ({myRating._count})</p>
        </Card>
      </div>

      {/* Matches needing attention */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-wide">Open matches</h2>
        {openMatches.length === 0 ? (
          <p className="text-sm text-muted">No scheduled or live matches. Create one to get the tables rolling.</p>
        ) : (
          openMatches.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              action={
                <EnterResultButton
                  matchId={m.id}
                  player1={m.player1.user.name}
                  player2={m.player2.user.name}
                  frames={m.frames}
                  currentStatus={m.status}
                  score1={m.score1}
                  score2={m.score2}
                />
              }
            />
          ))
        )}
      </section>

      {/* Pending reservations */}
      <section className="space-y-3">
        <CardHeader className="mb-0">
          <CardTitle className="text-2xl">Pending reservations</CardTitle>
        </CardHeader>
        <StaffReservationList
          reservations={pendingReservations.map((r) => ({
            id: r.id,
            playerName: r.player.user.name,
            avatarUrl: r.player.user.avatarUrl,
            tableName: r.table.name,
            start: r.startTime.toISOString(),
            end: r.endTime.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
