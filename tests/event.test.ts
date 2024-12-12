import { describe, test, expect } from "vitest";

import { Event } from "$src/index.js";

describe("event initialization", () => {
  test("base initialization", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York");

    expect(event.timestamp()).toEqual(1740501000);
  });

  test("timestamp initialization", () => {
    const event = new Event(1740501000, "America/New_York");

    expect(event.year()).toEqual(2025);
    expect(event.month()).toEqual(2);
    expect(event.day()).toEqual(25);

    expect(event.hour()).toEqual(11);
    expect(event.minute()).toEqual(30);
    expect(event.timezone()).toEqual("America/New_York");
  });

  test("pst to est initialization", () => {
    const pst_event = new Event("2025-02-25", "11:30", "America/Los_Angeles");
    const est_event = pst_event.in("America/New_York");

    expect(est_event.hour()).toEqual(14);
    expect(est_event.minute()).toEqual(pst_event.minute());
  });
});

describe("event recurrence", () => {
  test("no recurrence", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York");

    const EXPECTED: number[] = [event].map((e: Event) => e.timestamp());

    expect(event.next(3).map((e: Event) => e.timestamp())).toEqual(EXPECTED);
  });

  test("recur weekly", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York").every({
      weeks: 1,
    });

    const EXPECTED: number[] = [
      event,
      new Event("2025-03-04", "11:30", "America/New_York"),
      new Event("2025-03-11", "11:30", "America/New_York"),
    ].map((e: Event) => e.timestamp());

    expect(event.next(3).map((e: Event) => e.timestamp())).toEqual(EXPECTED);
  });
});

describe("event details", () => {
  test("standard weekday", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York");

    expect(event.weekday()).toEqual("Tuesday");
  });

  test("weekday around midnight", () => {
    const pst_event = new Event("2025-02-25", "23:45", "America/Los_Angeles");
    const est_event = pst_event.in("America/New_York");

    expect(pst_event.weekday()).toEqual("Tuesday");
    expect(est_event.weekday()).toEqual("Wednesday");
  });
});
