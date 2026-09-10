import { getI18n } from "@/lib/i18n/server";
import { Avatar } from "@/components/ui/avatar";
import { MatchTypeBadge, LiveBadge, Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import type { matchInclude } from "@/lib/queries";

export type MatchWithRelations = Prisma.MatchGetPayload<{
  include: typeof matchInclude;
}>;

export async function MatchRow({
  match,
  perspectivePlayerId,
  action,
}: {
  match: MatchWithRelations;
  /** When set, shows a Won/Lost chip from this player's perspective. */
  perspectivePlayerId?: string;
  action?: React.ReactNode;
}) {
  const { tr, locale } = await getI18n();

  const isCompleted = match.status === "COMPLETED";
  const won = perspectivePlayerId && match.winnerId === perspectivePlayerId;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center">
      {/* players + score */}
      <div className="flex flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar
            name={match.player1.user.name}
            src={match.player1.user.avatarUrl}
            size="sm"
          />
          <span
            className={`truncate text-sm font-semibold ${match.winnerId === match.player1Id ? "text-emerald-bright" : ""}`}
          >
            {match.player1.user.name}
          </span>
        </div>
        <div className="shrink-0 rounded-lg bg-elevated px-3 py-1 font-display text-xl tracking-widest">
          {match.status === "SCHEDULED"
            ? tr("vs")
            : `${match.score1} – ${match.score2}`}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <span
            className={`truncate text-end text-sm font-semibold ${match.winnerId === match.player2Id ? "text-emerald-bright" : ""}`}
          >
            {match.player2.user.name}
          </span>
          <Avatar
            name={match.player2.user.name}
            src={match.player2.user.avatarUrl}
            size="sm"
          />
        </div>
      </div>

      {/* meta */}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <MatchTypeBadge type={match.type} />
        {match.status === "LIVE" && <LiveBadge />}
        {match.status === "SCHEDULED" && (
          <Badge variant="blue">{tr("Upcoming")}</Badge>
        )}
        {isCompleted && perspectivePlayerId && (
          <Badge variant={won ? "emerald" : "live"}>
            {won ? tr("Won") : tr("Lost")}
          </Badge>
        )}
        {match.round && <Badge variant="purple">{match.round}</Badge>}
        <span className="text-xs text-faint">
          {match.table?.name} · {formatDateTime(match.scheduledAt, locale)}
        </span>
        {action}
      </div>
    </div>
  );
}
