import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Swords } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchInclude } from "@/lib/queries";
import type { MatchType, Prisma } from "@prisma/client";
import { MatchRow } from "@/components/features/match-row";
import { RateMatchButton } from "@/components/features/rate-match-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My matches" };

const FILTERS = ["ALL", "FRIENDLY", "RANKED", "TOURNAMENT", "CHAMPIONSHIP"] as const;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await auth();
  if (!session?.user.playerId) redirect("/login");
  const playerId = session.user.playerId;

  const { type } = await searchParams;
  const activeFilter = FILTERS.includes(type as (typeof FILTERS)[number])
    ? (type as (typeof FILTERS)[number])
    : "ALL";

  const where: Prisma.MatchWhereInput = {
    OR: [{ player1Id: playerId }, { player2Id: playerId }],
    ...(activeFilter !== "ALL" ? { type: activeFilter as MatchType } : {}),
  };

  const [matches, myRatings] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: [{ status: "asc" }, { scheduledAt: "desc" }],
      take: 60,
      include: matchInclude,
    }),
    prisma.rating.findMany({
      where: { playerId },
      select: { matchId: true },
    }),
  ]);
  const ratedMatchIds = new Set(myRatings.map((r) => r.matchId));

  const upcoming = matches.filter((m) => m.status === "SCHEDULED" || m.status === "LIVE");
  const past = matches.filter((m) => m.status === "COMPLETED" || m.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">My matches</h1>
        <p className="text-sm text-muted">
          Your full match log — friendlies, ranked play, tournaments and championships.
        </p>
      </div>

      {/* Type filter — swipeable on mobile */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/matches" : `/matches?type=${f}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeFilter === f
                ? "border-emerald-accent bg-emerald-accent/15 text-emerald-bright"
                : "border-border text-muted hover:border-border-strong hover:text-foreground"
            )}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl tracking-wide">Upcoming & live</h2>
          {upcoming.map((m) => (
            <MatchRow key={m.id} match={m} perspectivePlayerId={playerId} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-wide">History</h2>
        {past.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="No matches yet"
            description="Check in at the club and ask the staff to set up your first match."
          />
        ) : (
          past.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              perspectivePlayerId={playerId}
              action={
                m.status === "COMPLETED" && !ratedMatchIds.has(m.id) ? (
                  <RateMatchButton
                    matchId={m.id}
                    employeeName={m.managedBy?.user.name}
                  />
                ) : undefined
              }
            />
          ))
        )}
      </section>
    </div>
  );
}
