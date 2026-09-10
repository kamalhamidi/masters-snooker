"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PlayerRow = {
  id: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  points: number;
  trustBadge: boolean;
};

export function TrustBadgeManager({ players }: { players: PlayerRow[] }) {
  const { tr } = useI18n();

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  async function toggle(p: PlayerRow) {
    setBusy(p.id);
    const res = await fetch("/api/admin/trust-badge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: p.id, trustBadge: !p.trustBadge }),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error(tr("Could not update trust badge"));
      return;
    }
    toast.success(
      !p.trustBadge
        ? tr("{name} is now trusted", { name: p.name })
        : tr("Trust badge removed from {name}", { name: p.name }),
    );
    router.refresh();
  }

  return (
    <section>
      <CardHeader className="mb-4">
        <CardTitle className="text-2xl">{tr("Trust badges")}</CardTitle>
        <span className="text-sm text-muted">
          {players.filter((p) => p.trustBadge).length} {tr("trusted players")}
        </span>
      </CardHeader>

      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute start-4 top-1/2 -translate-y-1/2 text-faint"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("Search players…")}
          className="ps-10"
          aria-label={tr("Search players")}
        />
      </div>

      <Card className="divide-y divide-border p-0">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Avatar name={p.name} src={p.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-faint">
                {tr("Lv")} {p.level} · {p.points} {tr("pts")}
              </p>
            </div>
            <button
              onClick={() => toggle(p)}
              disabled={busy === p.id}
              aria-pressed={p.trustBadge}
              aria-label={tr("Trust badge for {name}", { name: p.name })}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                p.trustBadge
                  ? "border-emerald-accent/50 bg-emerald-accent/15 text-emerald-bright"
                  : "border-border text-faint hover:border-border-strong hover:text-muted",
              )}
            >
              <ShieldCheck size={14} />
              {p.trustBadge ? tr("Trusted") : tr("Grant")}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-faint">
            {tr("No players match “")}
            {query}”.
          </p>
        )}
      </Card>
    </section>
  );
}
