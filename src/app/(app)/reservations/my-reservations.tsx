"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { ReservationStatus } from "@prisma/client";

type Item = {
  id: string;
  tableName: string;
  start: string;
  end: string;
  status: ReservationStatus;
};

const STATUS_VARIANT: Record<ReservationStatus, "default" | "emerald" | "live" | "blue"> = {
  PENDING: "blue",
  CONFIRMED: "emerald",
  CANCELLED: "live",
  COMPLETED: "default",
};

export function MyReservations({ reservations }: { reservations: Item[] }) {
  const router = useRouter();

  async function cancel(id: string) {
    const res = await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "cancel" }),
    });
    if (!res.ok) {
      toast.error("Could not cancel");
      return;
    }
    toast.success("Reservation cancelled");
    router.refresh();
  }

  if (reservations.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl tracking-wide">My upcoming bookings</h2>
      {reservations.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center gap-3 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{r.tableName}</p>
            <p className="text-sm text-muted">
              {formatDateTime(r.start)} →{" "}
              {new Date(r.end).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[r.status]}>{r.status.toLowerCase()}</Badge>
          {(r.status === "PENDING" || r.status === "CONFIRMED") && (
            <Button variant="danger" size="sm" onClick={() => cancel(r.id)}>
              Cancel
            </Button>
          )}
        </Card>
      ))}
    </section>
  );
}
