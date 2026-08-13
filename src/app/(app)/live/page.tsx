import type { Metadata } from "next";
import { Radio, Film } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getClubSettings } from "@/lib/club";
import { matchInclude } from "@/lib/queries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveBadge, MatchTypeBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MatchRow } from "@/components/features/match-row";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Live" };
export const revalidate = 20;

export default async function LivePage() {
  const [settings, liveMatches, pastFinals] = await Promise.all([
    getClubSettings(),
    prisma.match.findMany({
      where: { status: "LIVE" },
      include: matchInclude,
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.match.findMany({
      where: {
        status: "COMPLETED",
        type: { in: ["TOURNAMENT", "CHAMPIONSHIP"] },
        round: { not: null },
      },
      include: matchInclude,
      orderBy: { completedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl tracking-wide">Live at the club</h1>
        {settings.isLive && <LiveBadge />}
      </div>

      {/* Stream embed */}
      {settings.isLive && settings.streamUrl ? (
        <Card className="overflow-hidden p-0">
          <div className="aspect-video w-full">
            <iframe
              src={settings.streamUrl}
              title={settings.streamTitle ?? "Live stream"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {settings.streamTitle && (
            <div className="flex items-center gap-3 p-4">
              <LiveBadge />
              <p className="font-semibold">{settings.streamTitle}</p>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          icon={Radio}
          title="No live broadcast right now"
          description="Championship nights and finals are streamed here. Follow the notification center to know when we go live."
        />
      )}

      {/* Live scores */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl tracking-wide">Happening now</h2>
          {liveMatches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </section>
      )}

      {/* Archive */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Film size={20} className="text-emerald-bright" />
          <h2 className="font-display text-2xl tracking-wide">Best of the archive</h2>
        </div>
        {pastFinals.length === 0 ? (
          <p className="text-sm text-muted">Highlights will appear after the next streamed event.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pastFinals.map((m) => (
              <Card key={m.id} className="group transition-all hover:-translate-y-0.5 hover:border-emerald-accent/40">
                <CardHeader className="mb-2">
                  <CardTitle className="text-lg">
                    {m.player1.user.name} vs {m.player2.user.name}
                  </CardTitle>
                  <MatchTypeBadge type={m.type} />
                </CardHeader>
                <div className="flex items-center justify-between">
                  <p className="font-display text-3xl tracking-widest text-emerald-bright">
                    {m.score1} – {m.score2}
                  </p>
                  <div className="text-right text-xs text-muted">
                    {m.round && <Badge variant="purple">{m.round}</Badge>}
                    <p className="mt-1">
                      {m.tournament?.name} · {m.completedAt && formatDate(m.completedAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
