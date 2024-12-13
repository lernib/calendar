import moment, { Moment, DurationInputObject } from "moment-timezone";
import { EventDuration, EventDurationInput } from "$src/duration.js";
import util from "node:util";

export type EventConstructorParams =
  | EventFromBase
  | EventFromStamp
  | EventFromEvent;
type EventFromBase = [string, string, string];
type EventFromStamp = [number, string];
type EventFromEvent = [Event];

type WeekdayString =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

const WEEKDAYS: WeekdayString[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Recurrence {
  weeks?: number;

  weekdays?: WeekdayString[];
  weekday?: WeekdayString;
}

function two_digits(n: number): string {
  if (n < 10) {
    return "0" + n.toString();
  } else {
    return n.toString();
  }
}

interface EventJSON {
  date: string;
  time: string;
  tz: string;
  recurs: Recurrence | null;
}

/**
 * An Event. Events keep track of the starting date/time, the timezone, any recurrence rules, and the duration.
 */
export class Event {
  private _inner: Moment;
  private _tz: string;
  private _recur: Recurrence | null;
  private _duration: EventDuration | null;

  /**
   * Create an event. There are two ways to create an event:
   * (1) `new Event("2020-04-01", "11:30", "America/New_York")`
   * (2) `new Event(1585755000, "America/New_York")`
   * @constructor
   * @param params - The parameters, following one of the two mentioned formats
   */
  constructor(...params: EventConstructorParams) {
    if (typeof params[0] == "string") {
      this._inner = moment.tz(`${params[0]} ${params[1]}`, params[2]);
      this._tz = params[2];
      this._recur = null;
      this._duration = null;
    } else if (typeof params[0] == "number") {
      this._inner = moment.unix(params[0]).tz(params[1]);
      this._tz = params[1];
      this._recur = null;
      this._duration = null;
    } else {
      this._inner = moment.unix(params[0].timestamp()).tz(params[0].timezone());
      this._tz = params[0].timezone();
      this._recur = params[0]._recur;
      this._duration = params[0]._duration;
    }
  }

  /**
   * Gets the unix timestamp for this event
   * @returns The unix timestamp
   */
  public timestamp(): number {
    return this._inner.unix();
  }

  /**
   * Gets the year as a number
   * @returns The year as a number
   */
  public year(): number {
    return this._inner.year();
  }

  /**
   * Gets the month as a number from 1 to 12
   * @returns The month as a number
   */
  public month(): number {
    return this._inner.month() + 1;
  }

  /**
   * Gets the day as a number from 1 to 31
   * @returns The day as a number
   */
  public day(): number {
    return this._inner.date();
  }

  /**
   * Gets the starting hour as a number from 0 to 23
   * @returns The starting hour
   */
  public hour(): number {
    return this._inner.hour();
  }

  /**
   * Gets the starting minute as a number from 0 to 59
   * @returns The starting minute
   */
  public minute(): number {
    return this._inner.minute();
  }

  /**
   * Gets the timezone
   * @returns The timezone, e.g. "America/New_York"
   */
  public timezone(): string {
    return this._tz;
  }

  private weekday_num(): number {
    return this._inner.weekday();
  }

  /**
   * Gets the weekday as a string
   * @returns The weekday, e.g. "Monday"
   */
  public weekday(): WeekdayString {
    return WEEKDAYS[this._inner.weekday()];
  }

  /**
   * Returns the same event at the same time from another time zone. For example, an event at 1pm PST is 4pm in EST. This does not modify the original.
   * @param tz - The new timezone
   * @returns The same event with a modified timezone.
   */
  public in(tz: string): Event {
    return new Event(this.timestamp(), tz);
  }

  /**
   * Returns an event with the duration value set. If the duration is already set, overwrite it. This does modify in place as a builder pattern for the Calendar class.
   * @param duration - A duration input, which must either have an `hours` key or a `minutes` key. It can have both.
   * @returns The new event with the duration set
   */
  public for_(duration: EventDurationInput): Event {
    this._duration = new EventDuration(duration);

    return this;
  }

  /**
   * The duration of the event
   */
  public get duration(): EventDuration {
    return this._duration;
  }

  /**
   * Returns an event with the recurrence value set. This does modify in place.
   * @param recur - The recurrence settings
   * @returns The same event with recurrence modified. This does create a clone.
   */
  public every(recur: Recurrence): Event {
    this._recur = recur;

    return this;
  }

  /**
   * Adds the duration to the internal Moment. This DOES NOT create a clone. This modified in place.
   * @param duration - The duration
   * @returns The event to be used in a builder pattern.
   */
  private plus(duration: DurationInputObject): Event {
    this._inner = this._inner.add(duration);

    return this;
  }

  /**
   * Given a recurrence rule, get the duration to the next event in the series.
   * @param recur - The recurrence rule set
   * @returns The duration to be used with Moment.js
   */
  private duration_to_next(recur: Recurrence): DurationInputObject {
    let weekdays = (this._recur.weekdays || []).map((s) => WEEKDAYS.indexOf(s));
    if (this._recur.weekday) {
      weekdays.push(WEEKDAYS.indexOf(this._recur.weekday));
    }

    if (weekdays.length == 0) {
      return {
        weeks: recur.weeks,
      };
    }

    let weekday = this.weekday_num();

    if (weekday < Math.max(...weekdays)) {
      let days = 1;

      while (weekdays.indexOf(weekday + days) == -1) {
        days += 1;
      }

      return { days };
    } else {
      let days = (recur.weeks || 1) * 7;
      days -= weekday - Math.min(...weekdays);

      return { days };
    }
  }

  /**
   * Gets the next N events in the series, including itself.
   * @param count - The maximum number of events to fetch
   * @returns The events themselves, up to `count` events. If there are not that many, return all of them.
   */
  public next(count: number): Event[] {
    let clone = new Event(this);

    if (this._recur == null) {
      return [clone];
    }

    let out = [];

    for (let i = 0; i < count; i++) {
      out.push(new Event(clone));

      clone = clone.plus(clone.duration_to_next(this._recur));
    }

    return out;
  }

  /**
   * Gets all of the events before a specific date.
   * @param date - The maximum date. This is not inclusive. If there is an event on March 1st and the limit is March 1st, that event is not included.
   * @returns The list of events
   */
  public all_before(date: string): Event[] {
    let out = this.next(2);

    if (out.length == 1) {
      return out;
    }

    let last = out.pop();

    while (last.timestamp() < new Event(date, "00:00", this._tz).timestamp()) {
      let nexts = last.next(2);

      out.push(nexts[0]);
      last = nexts[1];
    }

    return out;
  }

  /**
   * Converts the event to a JSON string
   * @returns The event as a string
   */
  public toJSON(): string {
    let out: EventJSON = {
      date: `${this.year()}-${two_digits(this.month())}-${two_digits(this.day())}`,
      time: `${two_digits(this.hour())}:${two_digits(this.minute())}`,
      tz: this._tz,
      recurs: this._recur,
    };

    return JSON.stringify(out);
  }

  /**
   * Creates an event from a JSON string
   * @param json - The JSON string
   * @returns The new event
   */
  public static fromJSON(json: string): Event {
    let obj: EventJSON = JSON.parse(json);

    let event = new Event(obj.date, obj.time, obj.tz);
    if (obj.recurs) {
      return event.every(obj.recurs);
    }

    return event;
  }

  /**
   * Checks if two events overlap. One event being right after another one does not count.
   * @param other - The other event
   * @returns Whether the two events overlap as a boolean.
   */
  public overlaps(other: Event): boolean {
    if (other._duration == null && this._duration == null)
      return other.timestamp() == this.timestamp();

    const end_other = other._inner
      .clone()
      .add({ minutes: other._duration.minutes });
    const end_this = this._inner
      .clone()
      .add({ minutes: this._duration.minutes });

    if (
      end_this.unix() > other.timestamp() &&
      this.timestamp() <= other.timestamp()
    ) {
      return true;
    }

    return (
      end_other.unix() > this.timestamp() &&
      other.timestamp() <= this.timestamp()
    );
  }

  [util.inspect.custom](depth, opts) {
    return `${this.year()}-${two_digits(this.month())}-${two_digits(this.day())} ${two_digits(this.hour())}:${two_digits(this.minute())} ${this.timezone()}`;
  }
}
