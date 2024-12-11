import moment, { Moment } from "moment-timezone";

type EventConstructorParams = EventFromBase | EventFromStamp;
type EventFromBase = [string, string, string];
type EventFromStamp = [number, string];

export class Event {
  private _inner: Moment;
  private _tz: string;

  constructor(...params: EventConstructorParams) {
    if (typeof params[0] == "string") {
      this._inner = moment.tz(`${params[0]} ${params[1]}`, params[2]);
      this._tz = params[2];
    } else {
      this._inner = moment.unix(params[0]).tz(params[1]);
      this._tz = params[1];
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
}
