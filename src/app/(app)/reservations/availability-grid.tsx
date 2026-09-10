"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, X, ArrowRight, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { cn, formatCents } from "@/lib/utils";

import {
  OPEN_HOUR,
  CLOSE_HOUR,
  reservationSlotDate,
  reservationSlotState,
  availableReservationDurations,
} from "@/lib/reservation-slots";

type TableInfo = {
  id: string;
  name: string;
  number: number;
  hourlyRate: number;
};
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
  const [picked, setPicked] = useState<{
    table: TableInfo;
    hour: number;
  } | null>(null);
  const [hours, setHours] = useState(1);
  const [bookForId, setBookForId] = useState(selfPlayerId ?? "");
  const [loading, setLoading] = useState(false);

  const hoursRange = Array.from(
    { length: CLOSE_HOUR - OPEN_HOUR },
    (_, i) => OPEN_HOUR + i,
  );

  const slotDate = (hour: number) => reservationSlotDate(date, hour);
  const slotState = (tableId: string, hour: number) =>
    reservationSlotState(date, tableId, hour, reservations);

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

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

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
          : "Reservation requested — staff will confirm shortly.",
      );
      setPicked(null);
      router.refresh();
    } catch {
      toast.error(
        "We couldn’t confirm your request. Check your reservations before trying again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fmtHour = (h: number) =>
    `${((h + 11) % 12) + 1}${h % 24 < 12 || h >= 24 ? "AM" : "PM"}`;

  const availableDurations = picked
    ? availableReservationDurations(
        date,
        picked.table.id,
        picked.hour,
        reservations,
      )
    : [];

  const bookingForOther = isStaff && bookForId && bookForId !== selfPlayerId;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide">
          Choose your table & time
        </h2>
        <p className="flex items-center gap-2 text-xs text-muted">
          Select an available slot <ArrowRight size={14} />
          <span className="sm:hidden">Swipe for more times</span>
        </p>
      </div>
      {tables.length === 0 && (
        <Card className="py-10 text-center">
          <CalendarClock className="mx-auto mb-3 text-gold" />
          <h3 className="font-display text-2xl">
            No tables available right now
          </h3>
          <p className="mt-2 text-sm text-muted">
            Please check back or ask the club staff for help.
          </p>
        </Card>
      )}
      <Card
        className="overflow-x-auto p-0"
        tabIndex={0}
        role="region"
        aria-label="Table availability, scroll horizontally for all times"
      >
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <caption className="sr-only">
            Hourly table availability for {date}. Available slots are marked
            with a plus, booked slots with a cross, and your bookings with a
            check.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-32 bg-surface p-3 text-left font-semibold"
              >
                Table
              </th>
              {hoursRange.map((h) => (
                <th
                  scope="col"
                  key={h}
                  className="p-1.5 text-center text-[11px] font-medium text-faint"
                >
                  {fmtHour(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface p-3 text-left font-normal"
                >
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-faint">
                    {formatCents(t.hourlyRate)}/hr
                  </p>
                </th>
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
                          "flex h-11 w-full min-w-11 items-center justify-center rounded-lg transition-all",
                          state === "free" &&
                            "bg-emerald-accent/15 hover:scale-105 hover:bg-emerald-accent/40 cursor-pointer",
                          state === "taken" && "bg-live/25 cursor-not-allowed",
                          state === "mine" && "bg-gold/40 cursor-not-allowed",
                          state === "past" &&
                            "bg-surface-hover cursor-not-allowed opacity-40",
                        )}
                      >
                        {state === "free" ? (
                          <span
                            aria-hidden
                            className="text-lg text-emerald-bright"
                          >
                            +
                          </span>
                        ) : state === "mine" ? (
                          <Check aria-hidden size={14} className="text-gold" />
                        ) : state === "taken" ? (
                          <X aria-hidden size={14} className="text-live" />
                        ) : (
                          <span aria-hidden className="text-faint">
                            –
                          </span>
                        )}
                      </button>
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
        onClose={() => {
          if (!loading) setPicked(null);
        }}
        title={isStaff ? "Book a table" : "Confirm booking"}
      >
        {picked && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="font-semibold">{picked.table.name}</p>
              <p className="text-sm text-muted">
                {slotDate(picked.hour).toLocaleDateString("en-US", {
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
                {availableDurations.map((h) => (
                  <option key={h} value={h}>
                    {h} hour{h > 1 ? "s" : ""} —{" "}
                    {formatCents(picked.table.hourlyRate * h)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gold/5 p-4">
              <span className="text-sm text-muted">Session total</span>
              <span className="font-display text-3xl text-gold">
                {formatCents(picked.table.hourlyRate * hours)}
              </span>
            </div>
            {!isStaff && (
              <p className="text-xs leading-relaxed text-muted">
                Your booking is a request until the club staff confirms it. You
                can track its status in your reservations.
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={book}
              disabled={loading || !availableDurations.includes(hours)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Submitting…"
                : isStaff
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
