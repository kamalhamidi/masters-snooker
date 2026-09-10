"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type PlayerOption = {
  id: string;
  name: string;
  level: number;
  points: number;
  checkedIn: boolean;
};

export function NewMatchForm({
  players,
  tables,
  tournaments,
}: {
  players: PlayerOption[];
  tables: { id: string; name: string }[];
  tournaments: { id: string; name: string }[];
}) {
  const { tr } = useI18n();

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("FRIENDLY");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const selected1 = players.find((p) => p.id === p1);
  const selected2 = players.find((p) => p.id === p2);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (p1 === p2) {
      toast.error(tr("Pick two different players"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player1Id: p1,
        player2Id: p2,
        type,
        tableId: form.get("tableId"),
        frames: Number(form.get("frames")),
        tournamentId: (form.get("tournamentId") as string) || undefined,
        round: (form.get("round") as string) || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(tr(data.error ?? tr("Could not create match")));
      return;
    }
    toast.success(tr("Match created — players notified"));
    router.push("/staff");
    router.refresh();
  }

  const playerLabel = (p: PlayerOption) =>
    tr("{name} — Level {level} · {points} pts", {
      name: p.name,
      level: p.level,
      points: p.points,
    }) + (p.checkedIn ? tr(" · ✓ here") : "");

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p1">{tr("Player 1")}</Label>
            <Select
              id="p1"
              required
              value={p1}
              onChange={(e) => setP1(e.target.value)}
            >
              <option value="">{tr("Select player…")}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === p2}>
                  {playerLabel(p)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="p2">{tr("Player 2")}</Label>
            <Select
              id="p2"
              required
              value={p2}
              onChange={(e) => setP2(e.target.value)}
            >
              <option value="">{tr("Select player…")}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === p1}>
                  {playerLabel(p)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {selected1 && selected2 && (
          <div className="flex items-center justify-center gap-4 rounded-xl border border-border bg-elevated p-4">
            <div className="text-center">
              <p className="font-semibold">{selected1.name}</p>
              <Badge variant="emerald">
                {tr("Lv")} {selected1.level}
              </Badge>
            </div>
            <Swords className="text-gold" />
            <div className="text-center">
              <p className="font-semibold">{selected2.name}</p>
              <Badge variant="emerald">
                {tr("Lv")} {selected2.level}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="type">{tr("Match type")}</Label>
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="FRIENDLY">{tr("Friendly — no ranking")}</option>
              <option value="RANKED">{tr("Ranked — rating updates")}</option>
              <option value="TOURNAMENT">{tr("Tournament")}</option>
              <option value="CHAMPIONSHIP">{tr("Championship")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="tableId">{tr("Table")}</Label>
            <Select id="tableId" name="tableId" required>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="frames">{tr("Best of")}</Label>
            <Select id="frames" name="frames" defaultValue={3}>
              {[1, 3, 5, 7, 9].map((f) => (
                <option key={f} value={f}>
                  {f} {tr("frames")}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {(type === "TOURNAMENT" || type === "CHAMPIONSHIP") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tournamentId">{tr("Tournament")}</Label>
              <Select id="tournamentId" name="tournamentId">
                <option value="">{tr("None")}</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="round">{tr("Round")}</Label>
              <Select id="round" name="round">
                {[
                  "Group stage",
                  "Round of 16",
                  "Quarter-final",
                  "Semi-final",
                  "Final",
                ].map((r) => (
                  <option key={r} value={r}>
                    {tr(r)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <Button
          size="lg"
          disabled={loading || !p1 || !p2}
          className="w-full sm:w-auto"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {tr("Create match")}
        </Button>
      </form>
    </Card>
  );
}
