import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Crown,
  Users,
  Calendar,
  ScrollText,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { matchInclude } from "@/lib/queries";
import { cn, formatCents, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MatchRow } from "@/components/features/match-row";
import { RegisterButton } from "./register-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { tr } = await getI18n();
  const { slug } = await params;
  const t = await prisma.tournament.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: t?.name ?? tr("Tournament") };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { tr, locale } = await getI18n();

  const { slug } = await params;
  const session = await auth();

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      entries: {
        include: {
          player: {
            include: { user: { select: { name: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      matches: {
        include: matchInclude,
        orderBy: { scheduledAt: "desc" },
      },
      winner: {
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
    },
  });
  if (!tournament) notFound();

  const approved = tournament.entries.filter((e) => e.status === "APPROVED");
  const myEntry = session?.user.playerId
    ? tournament.entries.find((e) => e.playerId === session.user.playerId)
    : undefined;

  const player = session?.user.playerId
    ? await prisma.player.findUnique({
        where: { id: session.user.playerId },
        select: { trustBadge: true },
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className={cn(
          "felt-texture relative overflow-hidden rounded-3xl p-6 sm:p-10",
          tournament.isChampionship && "ring-1 ring-gold/40",
        )}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {tournament.isChampionship && (
              <Badge variant="gold">
                <Crown size={13} /> {tr("Championship")}
              </Badge>
            )}
            <Badge
              variant={
                tournament.status === "REGISTRATION"
                  ? "emerald"
                  : tournament.status === "IN_PROGRESS"
                    ? "live"
                    : "default"
              }
            >
              {tr(tournament.status)}
            </Badge>
            <Badge variant="blue">{tr(tournament.format)}</Badge>
          </div>
          <h1 className="font-display text-4xl tracking-wide text-white sm:text-6xl">
            {tournament.name}
          </h1>
          <p className="mt-3 text-emerald-100/85">{tournament.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-100/75">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} /> {formatDate(tournament.startDate, locale)}
              {tournament.endDate &&
                ` – ${formatDate(tournament.endDate, locale)}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={15} /> {approved.length}/{tournament.maxPlayers}{" "}
              {tr("players")}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-gold-soft">
              <Trophy size={15} /> {formatCents(tournament.prizePool, locale)}{" "}
              {tr("prize pool")}
            </span>
          </div>
        </div>
      </div>

      {tournament.winner && (
        <Card className="flex items-center gap-4 border-gold/40 bg-gold/5">
          <Avatar
            name={tournament.winner.user.name}
            src={tournament.winner.user.avatarUrl}
            size="lg"
          />
          <div>
            <p className="text-sm text-gold">{tr("Champion")}</p>
            <p className="font-display text-3xl tracking-wide">
              {tournament.winner.user.name}
            </p>
          </div>
          <Crown className="ms-auto h-10 w-10 text-gold" />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Registration card */}
          {tournament.status === "REGISTRATION" && (
            <Card glass className="border-emerald-accent/30">
              <CardHeader>
                <CardTitle>{tr("Registration")}</CardTitle>
                <span className="font-display text-2xl text-gold">
                  {formatCents(tournament.entryFee, locale)}{" "}
                  <span className="text-sm text-muted">{tr("entry")}</span>
                </span>
              </CardHeader>
              {session?.user.playerId ? (
                <RegisterButton
                  tournamentId={tournament.id}
                  slug={tournament.slug}
                  entryStatus={myEntry?.status ?? null}
                  trustBadge={player?.trustBadge ?? false}
                  entryFee={tournament.entryFee}
                />
              ) : (
                <p className="text-sm text-muted">
                  <a href="/login" className="text-emerald-bright underline">
                    {tr("Log in")}
                  </a>{" "}
                  {tr("as a player to register.")}
                </p>
              )}
              {player && !player.trustBadge && (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-gold"
                  />
                  {tr(
                    "Players with a club trust badge are approved instantly. Your application will be reviewed by staff after payment.",
                  )}
                </p>
              )}
            </Card>
          )}

          {/* Matches */}
          {tournament.matches.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl tracking-wide">
                {tr("Matches")}
              </h2>
              {tournament.matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </section>
          )}

          {/* Rules */}
          {tournament.rules && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText size={18} className="text-emerald-bright" />{" "}
                  {tr("Rules")}
                </CardTitle>
              </CardHeader>
              <p className="whitespace-pre-line text-sm text-muted">
                {tournament.rules}
              </p>
            </Card>
          )}
        </div>

        {/* Players list */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{tr("Players")}</CardTitle>
            <Badge variant="emerald">
              {approved.length} {tr("confirmed")}
            </Badge>
          </CardHeader>
          <ul className="space-y-3">
            {tournament.entries
              .filter(
                (e) => e.status !== "WITHDRAWN" && e.status !== "REJECTED",
              )
              .map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar
                    name={e.player.user.name}
                    src={e.player.user.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {e.player.user.name}
                    </p>
                    <p className="text-xs text-faint">
                      {tr("Level")} {e.player.level}
                    </p>
                  </div>
                  {e.status === "PENDING" ? (
                    <Badge>{tr("pending")}</Badge>
                  ) : (
                    <Badge variant="emerald">{tr("in")}</Badge>
                  )}
                </li>
              ))}
            {tournament.entries.length === 0 && (
              <p className="text-sm text-faint">
                {tr("Be the first to register.")}
              </p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
