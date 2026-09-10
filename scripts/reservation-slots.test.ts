import assert from "node:assert/strict";
import test from "node:test";
import {
  availableReservationDurations,
  reservationSlotDate,
  reservationSlotState,
} from "../src/lib/reservation-slots";

const date = "2030-09-10";
const now = new Date(`${date}T09:00:00`);
const booked = [
  {
    tableId: "one",
    start: `${date}T12:00:00`,
    end: `${date}T13:00:00`,
    mine: false,
  },
];

test("a session cannot extend into another booking", () => {
  assert.deepEqual(
    availableReservationDurations(date, "one", 11, booked, now),
    [1],
  );
  assert.deepEqual(
    availableReservationDurations(date, "two", 11, booked, now),
    [1, 2, 3],
  );
  assert.deepEqual(
    availableReservationDurations(date, "one", 12, booked, now),
    [],
  );
});

test("adjacent bookings remain available without overlapping", () => {
  assert.equal(reservationSlotState(date, "one", 11, booked, now), "free");
  assert.equal(reservationSlotState(date, "one", 13, booked, now), "free");
  assert.equal(
    reservationSlotState(date, "one", 12, [{ ...booked[0], mine: true }], now),
    "mine",
  );
});

test("elapsed and already-started slots are unavailable", () => {
  assert.equal(
    reservationSlotState(date, "one", 10, [], new Date(`${date}T10:01:00`)),
    "past",
  );
  assert.deepEqual(
    availableReservationDurations(
      date,
      "one",
      10,
      [],
      new Date(`${date}T10:01:00`),
    ),
    [],
  );
});

test("after-midnight slots use the next date and respect closing time", () => {
  assert.equal(reservationSlotDate(date, 24).getDate(), 11);
  assert.equal(reservationSlotDate(date, 25).getHours(), 1);
  assert.deepEqual(
    availableReservationDurations(date, "one", 25, [], now),
    [1],
  );
  assert.deepEqual(
    availableReservationDurations(date, "one", 24, [], now),
    [1, 2],
  );
  assert.deepEqual(availableReservationDurations(date, "one", 26, [], now), []);
  assert.deepEqual(availableReservationDurations(date, "one", 9, [], now), []);
  const overnight = [
    {
      tableId: "one",
      start: "2030-09-11T00:00:00",
      end: "2030-09-11T01:00:00",
      mine: false,
    },
  ];
  assert.deepEqual(
    availableReservationDurations(date, "one", 23, overnight, now),
    [1],
  );
});
