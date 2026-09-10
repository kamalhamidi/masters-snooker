"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents, timeAgo } from "@/lib/utils";
import type { PaymentStatus } from "@prisma/client";

type Entry = {
  id: string;
  playerName: string;
  avatarUrl: string | null;
  level: number;
  points: number;
  trustBadge: boolean;
  tournamentName: string;
  entryFee: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export function ApplicationList({ entries }: { entries: Entry[] }) {
  const { tr, locale } = useI18n();

  const router = useRouter();

  async function act(entryId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/entries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId, action }),
    });
    if (!res.ok) {
      toast.error(tr("Action failed"));
      return;
    }
    toast.success(
      action === "approve"
        ? tr("Application approved")
        : tr("Application rejected"),
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <Card key={e.id} className="flex flex-wrap items-center gap-3 py-4">
          <Avatar name={e.playerName} src={e.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{e.playerName}</p>
            <p className="text-xs text-muted">
              {tr("Lv")} {e.level} · {e.points} {tr("pts · applied")}{" "}
              {timeAgo(e.createdAt, locale)}
            </p>
            <p className="mt-1 text-sm text-muted">{e.tournamentName}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={e.paymentStatus === "PAID" ? "emerald" : "live"}>
              {e.paymentStatus === "PAID"
                ? tr("paid {amount}", {
                    amount: formatCents(e.entryFee, locale),
                  })
                : tr("unpaid")}
            </Badge>
            {e.trustBadge && <Badge variant="gold">{tr("trusted")}</Badge>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => act(e.id, "approve")}>
              <Check size={14} /> {tr("Accept")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => act(e.id, "reject")}
            >
              <X size={14} />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
