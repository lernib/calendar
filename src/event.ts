import moment, { Moment, DurationInputObject } from "moment-timezone";
import util from "node:util";

type EventConstructorParams = EventFromBase | EventFromStamp | EventFromEvent;
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

export class Event {
  private _inner: Moment;
  private _tz: string;
  private _recur: Recurrence | null;

  constructor(...params: EventConstructorParams) {
    if (typeof params[0] == "string") {
      this._inner = moment.tz(`${params[0]} ${params[1]}`, params[2]);
      this._tz = params[2];
      this._recur = null;
    } else if (typeof params[0] == "number") {
      this._inner = moment.unix(params[0]).tz(params[1]);
      this._tz = params[1];
      this._recur = null;
    } else {
      this._inner = moment.unix(params[0].timestamp()).tz(params[0].timezone());
      this._tz = params[0].timezone();
      this._recur = params[0]._recur;
    }
  }

  public timestamp(): number {
    return this._inner.unix();
  }

  public year(): number {
    return this._inner.year();
  }

  public month(): number {
    return this._inner.month() + 1;
  }

  public day(): number {
    return this._inner.date();
  }

  public hour(): number {
    return this._inner.hour();
  }

  public minute(): number {
    return this._inner.minute();
  }

  public timezone(): string {
    return this._tz;
  }

  private weekday_num(): number {
    return this._inner.weekday();
  }

  public weekday(): WeekdayString {
    return WEEKDAYS[this._inner.weekday()];
  }

  public in(tz: string): Event {
    return new Event(this.timestamp(), tz);
  }

  public every(recur: Recurrence): Event {
    let clone = new Event(this);

    clone._recur = recur;

    return clone;
  }

  private plus(recur: DurationInputObject): Event {
    this._inner = this._inner.add(recur);

    return this;
  }

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

  public toJSON(): string {
    let out: EventJSON = {
      date: `${this.year()}-${two_digits(this.month())}-${two_digits(this.day())}`,
      time: `${two_digits(this.hour())}:${two_digits(this.minute())}`,
      tz: this._tz,
      recurs: this._recur,
    };

    return JSON.stringify(out);
  }

  public static fromJSON(json: string): Event {
    let obj: EventJSON = JSON.parse(json);

    let event = new Event(obj.date, obj.time, obj.tz);
    if (obj.recurs) {
      return event.every(obj.recurs);
    }

    return event;
  }

  [util.inspect.custom](depth, opts) {
    return `${this.year()}-${two_digits(this.month())}-${two_digits(this.day())} ${two_digits(this.hour())}:${two_digits(this.minute())} ${this.timezone()}`;
  }
}
