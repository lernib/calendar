import { describe, test, expect } from "vitest";

import { Event } from "$src/index.js";

describe("event initialization", () => {
  test("base initialization", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York");

    expect(event.timestamp()).toEqual(1740501000);
  });

  test("base with duration initialization", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York").for_({
      hours: 1,
      minutes: 30,
    });

    expect(event.timestamp()).toEqual(1740501000);
    expect(event.duration.minutes).toEqual(90);
    expect(event.duration.hours).toEqual(1.5);
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

  test("clone initialization", () => {
    const event = new Event("2025-02-25", "11:30", "America/New_York")
      .every({ weeks: 1 })
      .for_({ hours: 1 });

    const clone = new Event(event);

    expect(clone.timestamp()).toEqual(event.timestamp());
    expect(clone.timezone()).toEqual(event.timezone());
    expect(clone.duration.hours).toEqual(event.duration.hours);
    expect(clone.toJSON()).toEqual(event.toJSON());
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

  test("recur every Monday and Thursday", () => {
    const event = new Event("2025-02-24", "11:30", "America/New_York").every({
      weekdays: ["Monday", "Thursday"],
    });

    const EXPECTED: number[] = [
      event,
      new Event("2025-02-27", "11:30", "America/New_York"),
      new Event("2025-03-03", "11:30", "America/New_York"),
      new Event("2025-03-06", "11:30", "America/New_York"),
    ].map((e: Event) => e.timestamp());

    expect(event.next(4).map((e: Event) => e.timestamp())).toEqual(EXPECTED);
  });

  test("recur every other Monday and Thursday", () => {
    const event = new Event("2025-02-24", "11:30", "America/New_York").every({
      weeks: 2,
      weekdays: ["Monday", "Thursday"],
    });

    const EXPECTED: number[] = [
      event,
      new Event("2025-02-27", "11:30", "America/New_York"),
      new Event("2025-03-10", "11:30", "America/New_York"),
      new Event("2025-03-13", "11:30", "America/New_York"),
    ].map((e: Event) => e.timestamp());

    expect(event.next(4).map((e: Event) => e.timestamp())).toEqual(EXPECTED);
  });

  test("recur every other week every day except Tuesdays", () => {
    const event = new Event("2025-02-28", "11:30", "America/New_York").every({
      weeks: 2,
      weekdays: [
        "Sunday",
        "Monday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    });

    const EXPECTED: number[] = [
      event,
      new Event("2025-03-01", "11:30", "America/New_York"),
      new Event("2025-03-09", "11:30", "America/New_York"),
      new Event("2025-03-10", "11:30", "America/New_York"),
      new Event("2025-03-12", "11:30", "America/New_York"),
      new Event("2025-03-13", "11:30", "America/New_York"),
    ].map((e: Event) => e.timestamp());

    expect(event.next(6).map((e: Event) => e.timestamp())).toEqual(EXPECTED);
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

  test("all session before specific date", () => {
    const event = new Event("2025-02-03", "11:30", "America/New_York").every({
      weekdays: ["Monday", "Wednesday", "Friday"],
    });

    const EXPECTED: number[] = [
      event,
      new Event("2025-02-05", "11:30", "America/New_York"),
      new Event("2025-02-07", "11:30", "America/New_York"),
      new Event("2025-02-10", "11:30", "America/New_York"),
      new Event("2025-02-12", "11:30", "America/New_York"),
      new Event("2025-02-14", "11:30", "America/New_York"),
      new Event("2025-02-17", "11:30", "America/New_York"),
      new Event("2025-02-19", "11:30", "America/New_York"),
      new Event("2025-02-21", "11:30", "America/New_York"),
      new Event("2025-02-24", "11:30", "America/New_York"),
      new Event("2025-02-26", "11:30", "America/New_York"),
      new Event("2025-02-28", "11:30", "America/New_York"),
    ].map((e: Event) => e.timestamp());

    const all_of = event.all_before("2025-03-01");

    expect(all_of).toHaveLength(12);

    expect(all_of.map((e: Event) => e.timestamp())).toEqual(EXPECTED);
  });
});

describe("serialization", () => {
  test("json", () => {
    const event = new Event("2025-02-03", "11:30", "America/New_York").every({
      weekdays: ["Monday", "Wednesday", "Friday"],
    });

    const json = event.toJSON();
    const obj = JSON.parse(json);

    expect(obj).toEqual({
      date: "2025-02-03",
      time: "11:30",
      tz: "America/New_York",
      recurs: {
        weekdays: ["Monday", "Wednesday", "Friday"],
      },
    });

    expect(Event.fromJSON(json).timestamp()).toEqual(event.timestamp());
  });
});

describe("overlaps", () => {
  test("no duration", () => {
    const pst_event1 = new Event("2025-02-01", "12:00", "America/Los_Angeles");
    const est_event1 = pst_event1.in("America/New_York");

    expect(pst_event1.overlaps(est_event1)).toBeTruthy();

    const est_event2 = new Event("2025-02-01", "12:00", "America/New_York");

    expect(pst_event1.overlaps(est_event2)).toBeFalsy();
  });

  test("has duration", () => {
    const event1 = new Event("2025-02-01", "12:00", "America/New_York").for_({
      hours: 1,
    });

    // 30 minutes after event1
    const event2 = new Event("2025-02-01", "09:30", "America/Los_Angeles").for_(
      {
        hours: 1,
      },
    );

    // 1 hour after event1
    const event3 = new Event("2025-02-01", "10:00", "America/Los_Angeles").for_(
      {
        minutes: 30,
      },
    );

    expect(event1.overlaps(event2)).toBeTruthy();
    expect(event2.overlaps(event1)).toBeTruthy();

    expect(event2.overlaps(event3)).toBeTruthy();
    expect(event3.overlaps(event2)).toBeTruthy();

    expect(event1.overlaps(event3)).toBeFalsy();
    expect(event3.overlaps(event1)).toBeFalsy();
  });
});
