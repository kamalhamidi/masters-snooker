"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Flag } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { MatchStatus } from "@prisma/client";

export function EnterResultButton({
  matchId,
  player1,
  player2,
  frames,
  currentStatus,
  score1: initial1,
  score2: initial2,
}: {
  matchId: string;
  player1: string;
  player2: string;
  frames: number;
  currentStatus: MatchStatus;
  score1: number;
  score2: number;
}) {
  const { tr } = useI18n();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score1, setScore1] = useState(initial1);
  const [score2, setScore2] = useState(initial2);

  async function submit(status: "LIVE" | "COMPLETED" | "CANCELLED") {
    setLoading(true);
    const res = await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, score1, score2, status }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(tr(data.error ?? tr("Could not save result")));
      return;
    }
    if (status === "COMPLETED" && data.result) {
      toast.success(
        tr("{winner} wins — {result}", {
          winner: data.result.winner,
          result:
            data.result.winnerDelta > 0
              ? tr("+{points} pts exchanged", {
                  points: data.result.winnerDelta,
                })
              : tr("friendly, no points"),
        }),
      );
    } else {
      toast.success(
        status === "LIVE" ? tr("Score updated") : tr("Match cancelled"),
      );
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Flag size={14} />{" "}
        {currentStatus === "LIVE" ? tr("Update score") : tr("Manage")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={tr("Match result")}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            {tr("Best of")} {frames}{" "}
            {tr("frames. Enter frames won by each player.")}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="s1" className="truncate">
                {player1}
              </Label>
              <Input
                id="s1"
                type="number"
                min={0}
                max={frames}
                value={score1}
                onChange={(e) => setScore1(Number(e.target.value))}
                className="text-center font-display text-2xl"
              />
            </div>
            <div>
              <Label htmlFor="s2" className="truncate">
                {player2}
              </Label>
              <Input
                id="s2"
                type="number"
                min={0}
                max={frames}
                value={score2}
                onChange={(e) => setScore2(Number(e.target.value))}
                className="text-center font-display text-2xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => submit("LIVE")}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tr("Save as live")}
            </Button>
            <Button onClick={() => submit("COMPLETED")} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tr("Complete match")}
            </Button>
          </div>
          <button
            onClick={() => submit("CANCELLED")}
            className="w-full text-center text-xs text-live/80 hover:text-live"
          >
            {tr("Cancel this match")}
          </button>
        </div>
      </Dialog>
    </>
  );
}
