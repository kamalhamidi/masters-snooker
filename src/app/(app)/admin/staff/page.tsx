import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffManager } from "./staff-manager";
import { TrustBadgeManager } from "./trust-badge-manager";

export const metadata: Metadata = { title: "Staff & trust badges" };

export default async function AdminStaffPage() {
  const session = await auth();
  if (session?.user.role !== "CHEF") redirect("/dashboard");

  const [employees, players] = await Promise.all([
    prisma.employee.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        _count: { select: { matchesManaged: true } },
      },
      orderBy: { hiredAt: "asc" },
    }),
    prisma.player.findMany({
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { points: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Staff & trust badges</h1>
        <p className="text-sm text-muted">
          Manage employee accounts and decide which players skip tournament approval.
        </p>
      </div>

      <StaffManager
        employees={employees.map((e) => ({
          userId: e.user.id,
          name: e.user.name,
          email: e.user.email,
          role: e.user.role,
          avatarUrl: e.user.avatarUrl,
          position: e.position,
          matchesManaged: e._count.matchesManaged,
        }))}
      />

      <TrustBadgeManager
        players={players.map((p) => ({
          id: p.id,
          name: p.user.name,
          avatarUrl: p.user.avatarUrl,
          level: p.level,
          points: p.points,
          trustBadge: p.trustBadge,
        }))}
      />
    </div>
  );
}
