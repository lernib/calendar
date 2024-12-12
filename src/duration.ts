export interface EventDurationInput {
  hours?: number;
  minutes?: number;
}

/**
 * The duration of a specific event, in minutes or hours
 */
export class EventDuration {
  private _hours?: number;
  private _minutes?: number;

  /**
   * Create an EventDuration. You probably want to use `Event.for_(duration).duration()` instead.
   * @constructor
   * @param input - An input object that must have either an hours key or a minutes key,
   */
  public constructor(input: EventDurationInput) {
    if (this.hours == undefined && this.minutes == undefined) {
      throw new Error("A duration must have some time in it");
    }

    this._hours = input.hours;
    this._minutes = input.minutes;
  }

  /**
   * Gets the number of hours for the duration.
   * @returns The number of hours. This will include the number of minutes as a decimal.
   */
  public get hours(): number {
    return (this._hours || 0) + (this._minutes || 0) / 60;
  }

  /**
   * Gets the number of minutes for the duration.
   * @returns The number of minutes. This will include the number of hours multiplied by 60.
   */
  public get minutes(): number {
    return (this._hours || 0) * 60 + (this._minutes || 0);
  }
}
