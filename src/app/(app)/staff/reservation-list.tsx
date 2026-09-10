"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";

type Item = {
  id: string;
  playerName: string;
  avatarUrl: string | null;
  tableName: string;
  start: string;
  end: string;
};

export function StaffReservationList({
  reservations,
}: {
  reservations: Item[];
}) {
  const { tr, locale } = useI18n();

  const router = useRouter();

  async function act(id: string, action: "confirm" | "cancel") {
    const res = await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      toast.error(tr("Action failed"));
      return;
    }
    toast.success(
      action === "confirm"
        ? tr("Reservation confirmed")
        : tr("Reservation cancelled"),
    );
    router.refresh();
  }

  if (reservations.length === 0) {
    return (
      <p className="text-sm text-muted">
        {tr("No pending reservations — all caught up.")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center gap-3 py-4">
          <Avatar name={r.playerName} src={r.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.playerName}</p>
            <p className="text-sm text-muted">
              {r.tableName} · {formatDateTime(r.start, locale)} →{" "}
              {new Date(r.end).toLocaleTimeString(locale, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => act(r.id, "confirm")}>
              <Check size={14} /> {tr("Confirm")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => act(r.id, "cancel")}
            >
              <X size={14} />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
