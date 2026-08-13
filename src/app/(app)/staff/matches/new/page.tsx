import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewMatchForm } from "./new-match-form";

export const metadata: Metadata = { title: "Create match" };

export default async function NewMatchPage() {
  const session = await auth();
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")) {
    redirect("/dashboard");
  }

  const [players, tables, tournaments] = await Promise.all([
    prisma.player.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { points: "desc" },
    }),
    prisma.table.findMany({ where: { isActive: true }, orderBy: { number: "asc" } }),
    prisma.tournament.findMany({
      where: { status: { in: ["REGISTRATION", "IN_PROGRESS"] } },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Create a match</h1>
        <p className="text-sm text-muted">
          Pair two registered players, pick a table and match type. Ranked and
          competition matches move the leaderboard.
        </p>
      </div>
      <NewMatchForm
        players={players.map((p) => ({
          id: p.id,
          name: p.user.name,
          level: p.level,
          points: p.points,
          checkedIn:
            !!p.checkedInAt &&
            new Date(p.checkedInAt).toDateString() === new Date().toDateString(),
        }))}
        tables={tables.map((t) => ({ id: t.id, name: t.name }))}
        tournaments={tournaments}
      />
    </div>
  );
}
