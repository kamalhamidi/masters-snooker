import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign, Users, Table2, Trophy, PlusCircle, Inbox, Settings, UserCog, Star,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCounter } from "@/components/ui/stat-counter";
import { SimpleBarChart } from "@/components/charts/bar-chart";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (session?.user.role !== "CHEF") redirect("/dashboard");

  const [
    memberCount,
    entryRevenue,
    reservations,
    tables,
    employees,
    pendingApplications,
    completedMatches,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PLAYER" } }),
    prisma.tournamentEntry.findMany({
      where: { paymentStatus: "PAID" },
      include: { tournament: { select: { entryFee: true } } },
    }),
    prisma.reservation.findMany({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      include: { table: { select: { hourlyRate: true } } },
    }),
    prisma.table.findMany({
      include: { _count: { select: { matches: true, reservations: true } } },
      orderBy: { number: "asc" },
    }),
    prisma.employee.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { matchesManaged: true, checkInsDone: true } },
        ratings: { select: { serviceStars: true } },
      },
    }),
    prisma.tournamentEntry.count({ where: { status: "PENDING" } }),
    prisma.match.findMany({
      where: { status: "COMPLETED", completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);

  const totalEntryRevenue = entryRevenue.reduce((s, e) => s + e.tournament.entryFee, 0);
  const reservationRevenue = reservations.reduce((s, r) => {
    const hours = (r.endTime.getTime() - r.startTime.getTime()) / 3_600_000;
    return s + Math.round(hours * r.table.hourlyRate);
  }, 0);
  const totalRevenue = totalEntryRevenue + reservationRevenue;

  // Matches per week (last 8 weeks)
  const weeks: { label: string; value: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = new Date();
    start.setDate(start.getDate() - (w + 1) * 7);
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    weeks.push({
      label: end.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: completedMatches.filter(
        (m) => m.completedAt! >= start && m.completedAt! < end
      ).length,
    });
  }

  const maxTableUse = Math.max(...tables.map((t) => t._count.matches + t._count.reservations), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Admin dashboard</h1>
          <p className="text-sm text-muted">The whole club at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/applications">
            <Button variant="secondary">
              <Inbox size={16} /> Applications
              {pendingApplications > 0 && (
                <Badge variant="live">{pendingApplications}</Badge>
              )}
            </Button>
          </Link>
          <Link href="/admin/staff">
            <Button variant="secondary"><UserCog size={16} /> Staff & badges</Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="secondary"><Settings size={16} /> Settings</Button>
          </Link>
          <Link href="/admin/tournaments/new">
            <Button variant="gold"><PlusCircle size={16} /> New tournament</Button>
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <DollarSign className="mb-2 h-5 w-5 text-gold" />
          <p className="font-display text-3xl tracking-wide">{formatCents(totalRevenue)}</p>
          <p className="text-xs text-muted">Total revenue</p>
          <p className="mt-1 text-[11px] text-faint">
            {formatCents(totalEntryRevenue)} entries · {formatCents(reservationRevenue)} tables
          </p>
        </Card>
        <Card>
          <Users className="mb-2 h-5 w-5 text-emerald-bright" />
          <p className="font-display text-3xl tracking-wide"><StatCounter value={memberCount} /></p>
          <p className="text-xs text-muted">Registered players</p>
        </Card>
        <Card>
          <Trophy className="mb-2 h-5 w-5 text-gold" />
          <p className="font-display text-3xl tracking-wide"><StatCounter value={completedMatches.length} /></p>
          <p className="text-xs text-muted">Matches completed</p>
        </Card>
        <Card>
          <Table2 className="mb-2 h-5 w-5 text-emerald-bright" />
          <p className="font-display text-3xl tracking-wide"><StatCounter value={reservations.length} /></p>
          <p className="text-xs text-muted">Confirmed bookings</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity chart */}
        <Card>
          <CardHeader>
            <CardTitle>Matches per week</CardTitle>
          </CardHeader>
          <SimpleBarChart data={weeks} />
        </Card>

        {/* Table utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Table utilization</CardTitle>
            <Badge variant="emerald">matches + bookings</Badge>
          </CardHeader>
          <div className="space-y-3.5">
            {tables.map((t) => {
              const use = t._count.matches + t._count.reservations;
              return (
                <div key={t.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted">{use}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-felt-light to-emerald-accent"
                      style={{ width: `${Math.round((use / maxTableUse) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Employee performance */}
      <Card className="p-0">
        <CardHeader className="mb-0 px-5 pt-5">
          <CardTitle>Employee performance</CardTitle>
        </CardHeader>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Position</th>
                <th className="px-5 py-3 text-right">Matches managed</th>
                <th className="px-5 py-3 text-right">Check-ins</th>
                <th className="px-5 py-3 text-right">Service rating</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const avg =
                  e.ratings.length > 0
                    ? (e.ratings.reduce((s, r) => s + r.serviceStars, 0) / e.ratings.length).toFixed(1)
                    : "—";
                return (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-semibold">{e.user.name}</td>
                    <td className="px-5 py-3.5 text-muted">{e.position}</td>
                    <td className="px-5 py-3.5 text-right font-display text-lg">{e._count.matchesManaged}</td>
                    <td className="px-5 py-3.5 text-right font-display text-lg">{e._count.checkInsDone}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-gold">
                        <Star size={13} className="fill-gold" /> {avg}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="space-y-3 p-4 sm:hidden">
          {employees.map((e) => {
            const avg =
              e.ratings.length > 0
                ? (e.ratings.reduce((s, r) => s + r.serviceStars, 0) / e.ratings.length).toFixed(1)
                : "—";
            return (
              <div key={e.id} className="rounded-xl border border-border p-4">
                <div className="flex justify-between">
                  <p className="font-semibold">{e.user.name}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-gold">
                    <Star size={12} className="fill-gold" /> {avg}
                  </span>
                </div>
                <p className="text-xs text-muted">{e.position}</p>
                <p className="mt-2 text-sm text-muted">
                  {e._count.matchesManaged} matches · {e._count.checkInsDone} check-ins
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
