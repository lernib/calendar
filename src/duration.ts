export interface EventDurationInput {
  hours?: number;
  minutes?: number;
}

export class EventDuration {
  private _hours?: number;
  private _minutes?: number;

  public constructor(input: EventDurationInput) {
    if (this.hours == undefined && this.minutes == undefined) {
      throw new Error("A duration must have some time in it");
    }

    this._hours = input.hours;
    this._minutes = input.minutes;
  }

  public get hours(): number {
    return (this._hours || 0) + (this._minutes || 0) / 60;
  }

  public get minutes(): number {
    return (this._hours || 0) * 60 + (this._minutes || 0);
  }
}
