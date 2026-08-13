"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { cn, formatCents } from "@/lib/utils";

const OPEN_HOUR = 10;
const CLOSE_HOUR = 26;

type TableInfo = { id: string; name: string; number: number; hourlyRate: number };
type Slot = { tableId: string; start: string; end: string; mine: boolean };
type PlayerOption = { id: string; name: string; isSelf: boolean };

export function AvailabilityGrid({
  date,
  tables,
  reservations,
  isStaff = false,
  selfPlayerId,
  players,
}: {
  date: string;
  tables: TableInfo[];
  reservations: Slot[];
  isStaff?: boolean;
  selfPlayerId?: string;
  players?: PlayerOption[];
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<{ table: TableInfo; hour: number } | null>(null);
  const [hours, setHours] = useState(1);
  const [bookForId, setBookForId] = useState(selfPlayerId ?? "");
  const [loading, setLoading] = useState(false);

  const hoursRange = Array.from(
    { length: CLOSE_HOUR - OPEN_HOUR },
    (_, i) => OPEN_HOUR + i
  );

  function slotDate(hour: number): Date {
    const d = new Date(`${date}T00:00:00`);
    d.setHours(hour % 24, 0, 0, 0);
    if (hour >= 24) d.setDate(d.getDate() + 1);
    return d;
  }

  function slotState(tableId: string, hour: number): "free" | "taken" | "mine" | "past" {
    const start = slotDate(hour);
    const end = new Date(start.getTime() + 3600 * 1000);
    if (end < new Date()) return "past";
    for (const r of reservations) {
      if (r.tableId !== tableId) continue;
      const rs = new Date(r.start);
      const re = new Date(r.end);
      if (rs < end && re > start) return r.mine ? "mine" : "taken";
    }
    return "free";
  }

  async function book() {
    if (!picked) return;
    setLoading(true);

    const payload: {
      tableId: string;
      startTime: string;
      hours: number;
      playerId?: string;
    } = {
      tableId: picked.table.id,
      startTime: slotDate(picked.hour).toISOString(),
      hours,
    };

    if (isStaff && bookForId && bookForId !== selfPlayerId) {
      payload.playerId = bookForId;
    }

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Booking failed");
      return;
    }

    const forOther = isStaff && bookForId && bookForId !== selfPlayerId;
    const selectedName = players?.find((p) => p.id === bookForId)?.name;

    toast.success(
      isStaff
        ? forOther
          ? `Table booked for ${selectedName}`
          : "Your reservation is confirmed"
        : "Reservation requested — staff will confirm shortly."
    );
    setPicked(null);
    router.refresh();
  }

  const fmtHour = (h: number) =>
    `${((h + 11) % 12) + 1}${h % 24 < 12 || h >= 24 ? "AM" : "PM"}`;

  const bookingForOther = isStaff && bookForId && bookForId !== selfPlayerId;

  return (
    <>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface p-3 text-left font-semibold">Table</th>
              {hoursRange.map((h) => (
                <th key={h} className="p-1.5 text-center text-[11px] font-medium text-faint">
                  {fmtHour(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="sticky left-0 bg-surface p-3">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-faint">{formatCents(t.hourlyRate)}/hr</p>
                </td>
                {hoursRange.map((h) => {
                  const state = slotState(t.id, h);
                  return (
                    <td key={h} className="p-1">
                      <button
                        disabled={state !== "free"}
                        onClick={() => {
                          setHours(1);
                          setBookForId(selfPlayerId ?? "");
                          setPicked({ table: t, hour: h });
                        }}
                        aria-label={`${t.name} at ${fmtHour(h)} — ${state}`}
                        className={cn(
                          "h-9 w-full min-w-[34px] rounded-md transition-all",
                          state === "free" &&
                            "bg-emerald-accent/15 hover:scale-105 hover:bg-emerald-accent/40 cursor-pointer",
                          state === "taken" && "bg-live/25 cursor-not-allowed",
                          state === "mine" && "bg-gold/40 cursor-not-allowed",
                          state === "past" && "bg-surface-hover cursor-not-allowed opacity-40"
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-accent/25" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-live/25" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gold/40" /> Yours
        </span>
      </div>

      <Dialog
        open={!!picked}
        onClose={() => setPicked(null)}
        title={isStaff ? "Book a table" : "Confirm booking"}
      >
        {picked && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="font-semibold">{picked.table.name}</p>
              <p className="text-sm text-muted">
                {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · starting {fmtHour(picked.hour)}
              </p>
            </div>

            {isStaff && players && players.length > 0 && (
              <div>
                <Label htmlFor="bookFor">Book for</Label>
                <Select
                  id="bookFor"
                  value={bookForId}
                  onChange={(e) => setBookForId(e.target.value)}
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.isSelf ? " (me)" : ""}
                    </option>
                  ))}
                </Select>
                {bookingForOther && (
                  <p className="mt-1.5 text-xs text-emerald-bright">
                    Confirmed instantly — the player will be notified.
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select
                id="duration"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                {[1, 2, 3].map((h) => (
                  <option key={h} value={h}>
                    {h} hour{h > 1 ? "s" : ""} — {formatCents(picked.table.hourlyRate * h)}
                  </option>
                ))}
              </Select>
            </div>

            <Button className="w-full" size="lg" onClick={book} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isStaff
                ? bookingForOther
                  ? "Book for member"
                  : "Confirm my booking"
                : "Request reservation"}
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}
