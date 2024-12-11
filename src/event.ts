import moment, { Moment, DurationInputObject } from "moment-timezone";

type EventConstructorParams = EventFromBase | EventFromStamp | EventFromEvent;
type EventFromBase = [string, string, string];
type EventFromStamp = [number, string];
type EventFromEvent = [Event];

export class Event {
  private _inner: Moment;
  private _tz: string;
  private _recur: DurationInputObject | null;

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

  public in(tz: string): Event {
    return new Event(this.timestamp(), tz);
  }

  public every(recur: DurationInputObject): Event {
    let clone = new Event(this);

    clone._recur = recur;

    return clone;
  }

  private plus(recur: DurationInputObject): Event {
    this._inner = this._inner.add(recur);

    return this;
  }

  public next(count: number): Event[] {
    let clone = new Event(this);

    if (this._recur == null) {
      return [clone];
    }

    let out = [];

    for (let i = 0; i < count; i++) {
      out.push(new Event(clone));
      clone = clone.plus(this._recur);
    }

    return out;
  }
}
