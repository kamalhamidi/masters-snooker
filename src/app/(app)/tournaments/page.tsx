import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn, formatCents, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Tournaments") };
}

const STATUS_LABEL = {
  REGISTRATION: { label: "Registering", variant: "emerald" as const },
  IN_PROGRESS: { label: "In progress", variant: "live" as const },
  COMPLETED: { label: "Completed", variant: "default" as const },
  DRAFT: { label: "Draft", variant: "default" as const },
  CANCELLED: { label: "Cancelled", variant: "default" as const },
};

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "running", label: "In progress" },
  { key: "past", label: "Past" },
] as const;

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { tr, locale } = await getI18n();

  const session = await auth();
  const { view } = await searchParams;
  const active = FILTERS.some((f) => f.key === view) ? view : "open";

  const tournaments = await prisma.tournament.findMany({
    where:
      active === "open"
        ? { status: "REGISTRATION" }
        : active === "running"
          ? { status: "IN_PROGRESS" }
          : { status: { in: ["COMPLETED", "CANCELLED"] } },
    orderBy: { startDate: active === "past" ? "desc" : "asc" },
    include: {
      _count: { select: { entries: true } },
      winner: { include: { user: { select: { name: true } } } },
      entries: session?.user.playerId
        ? {
            where: { playerId: session.user.playerId },
            select: { status: true },
          }
        : false,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">
          {tr("Tournaments")}
        </h1>
        <p className="text-sm text-muted">
          {tr("Register online, pay the entry fee and chase the prize pool.")}
        </p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/tournaments?view=${f.key}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === f.key
                ? "border-emerald-accent bg-emerald-accent/15 text-emerald-bright"
                : "border-border text-muted hover:border-border-strong hover:text-foreground",
            )}
          >
            {tr(f.label)}
          </Link>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={tr("Nothing here yet")}
          description="New tournaments are announced in the notification center — stay tuned."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((t) => {
            const myEntry = Array.isArray(t.entries) ? t.entries[0] : undefined;
            const s = STATUS_LABEL[t.status];
            return (
              <Link key={t.id} href={`/tournaments/${t.slug}`}>
                <Card className="group flex h-full flex-col transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5">
                  {/* banner strip */}
                  <div
                    className={cn(
                      "relative -mx-5 -mt-5 mb-4 flex h-24 items-end justify-between rounded-t-2xl px-5 pb-3",
                      t.isChampionship
                        ? "bg-gradient-to-br from-gold/30 via-felt to-felt"
                        : "bg-gradient-to-br from-emerald-accent/25 via-felt to-felt",
                    )}
                  >
                    {t.isChampionship && (
                      <Crown className="absolute end-4 top-4 h-6 w-6 text-gold" />
                    )}
                    <Badge variant={s.variant}>{tr(s.label)}</Badge>
                    {myEntry && (
                      <Badge
                        variant={
                          myEntry.status === "APPROVED"
                            ? "emerald"
                            : myEntry.status === "REJECTED"
                              ? "live"
                              : "blue"
                        }
                      >
                        {myEntry.status === "APPROVED"
                          ? tr("You're in")
                          : myEntry.status === "PENDING"
                            ? tr("Application pending")
                            : tr(myEntry.status)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-2xl tracking-wide group-hover:text-gold-soft">
                    {t.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                    {t.description}
                  </p>
                  {t.winner && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-gold">
                      <Trophy size={14} /> {tr("Won by")} {t.winner.user.name}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted">
                      <Users size={14} />
                      {t._count.entries}/{t.maxPlayers}
                    </span>
                    <span className="text-muted">
                      {formatDate(t.startDate, locale)}
                    </span>
                    <span className="font-semibold text-gold">
                      {formatCents(t.prizePool, locale)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
