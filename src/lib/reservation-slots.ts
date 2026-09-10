export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 26;

export type ReservationSlot = {
  tableId: string;
  start: string;
  end: string;
  mine: boolean;
};

/** Hours 24 and 25 belong to the following calendar day. */
export function reservationSlotDate(date: string, hour: number): Date {
  const result = new Date(`${date}T00:00:00`);
  result.setHours(hour, 0, 0, 0);
  return result;
}

export function reservationSlotState(
  date: string,
  tableId: string,
  hour: number,
  reservations: ReservationSlot[],
  now = new Date(),
): "free" | "taken" | "mine" | "past" {
  const start = reservationSlotDate(date, hour);
  if (start <= now) return "past";
  const end = new Date(start.getTime() + 3_600_000);
  const overlap = reservations.find(
    (reservation) =>
      reservation.tableId === tableId &&
      new Date(reservation.start) < end &&
      new Date(reservation.end) > start,
  );
  return overlap ? (overlap.mine ? "mine" : "taken") : "free";
}

export function availableReservationDurations(
  date: string,
  tableId: string,
  hour: number,
  reservations: ReservationSlot[],
  now = new Date(),
): number[] {
  return [1, 2, 3].filter(
    (duration) =>
      hour >= OPEN_HOUR &&
      hour + duration <= CLOSE_HOUR &&
      Array.from({ length: duration }, (_, offset) =>
        reservationSlotState(date, tableId, hour + offset, reservations, now),
      ).every((state) => state === "free"),
  );
}
