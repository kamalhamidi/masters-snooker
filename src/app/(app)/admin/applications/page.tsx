import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationList } from "./application-list";

export const metadata: Metadata = { title: "Tournament applications" };

export default async function ApplicationsPage() {
  const session = await auth();
  if (session?.user.role !== "CHEF") redirect("/dashboard");

  const entries = await prisma.tournamentEntry.findMany({
    where: { status: "PENDING" },
    include: {
      tournament: { select: { name: true, slug: true, entryFee: true } },
      player: {
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Applications</h1>
        <p className="text-sm text-muted">
          Players without a trust badge need your approval — check payment
          status before accepting.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox zero"
          description="No pending tournament applications right now."
        />
      ) : (
        <ApplicationList
          entries={entries.map((e) => ({
            id: e.id,
            playerName: e.player.user.name,
            avatarUrl: e.player.user.avatarUrl,
            level: e.player.level,
            points: e.player.points,
            trustBadge: e.player.trustBadge,
            tournamentName: e.tournament.name,
            entryFee: e.tournament.entryFee,
            paymentStatus: e.paymentStatus,
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
