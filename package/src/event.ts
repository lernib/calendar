import moment, { Moment, DurationInputObject } from 'moment-timezone';
import { EventDuration, EventDurationInput } from '$src/duration.js';
import { v4 as uuidv4 } from 'uuid';
import util from 'node:util';

export type EventConstructorParams<I extends object> =
	| EventFromBase
	| EventFromStamp
	| EventFromEvent<I>;
type EventFromBase = [string, string, string];
type EventFromStamp = [number, string];
type EventFromEvent<I extends object> = [Event<I>];

export type NextEventAfterParams = NextEventAfterFromDate | NextEventAfterFromDateTime;
type NextEventAfterFromDate = [string, string];
type NextEventAfterFromDateTime = [string, string, string];

type WeekdayString =
	| 'Sunday'
	| 'Monday'
	| 'Tuesday'
	| 'Wednesday'
	| 'Thursday'
	| 'Friday'
	| 'Saturday';

const WEEKDAYS: WeekdayString[] = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];

const SECONDS_IN_DAY = 86400;

interface Recurrence {
	weeks?: number;

	weekdays?: WeekdayString[];
	weekday?: WeekdayString;
}

function two_digits(n: number): string {
	if (n < 10) {
		return '0' + n.toString();
	} else {
		return n.toString();
	}
}

export type EventJSON<InfoT extends object = null> =
	| EventJSONWithInfo<InfoT>
	| EventJSONWithoutInfo;

interface EventJSONWithoutInfo {
	date: string;
	time: string;
	tz: string;
	event_id: string;
	recurs: Recurrence | null;
	exclude: number[];
}

export interface EventJSONWithInfo<InfoT extends object> {
	date: string;
	time: string;
	tz: string;
	event_id: string;
	recurs: Recurrence | null;
	exclude: number[];
	info: InfoT;
}

/**
 * An Event. Events keep track of the starting date/time, the timezone, any recurrence rules, and the duration.
 */
export class Event<InfoT extends object = null> {
	private _inner: Moment;
	private _tz: string;
	private _recur: Recurrence | null;
	private _duration: EventDuration | null;
	private _eventid: string;
	private _exclude: number[];
	private _info: InfoT;

	/**
	 * Create an event. There are two ways to create an event:
	 * (1) `new Event("2020-04-01", "11:30", "America/New_York")`
	 * (2) `new Event(1585755000, "America/New_York")`
	 * @constructor
	 * @param params - The parameters, following one of the two mentioned formats
	 */
	constructor(...params: EventConstructorParams<InfoT>) {
		if (typeof params[0] == 'string') {
			this._inner = moment.tz(`${params[0]} ${params[1]}`, params[2]);
			this._tz = params[2];
			this._recur = null;
			this._duration = null;
			this._eventid = uuidv4();
			this._exclude = [];
			this._info = null;
		} else if (typeof params[0] == 'number') {
			this._inner = moment.unix(params[0]).tz(params[1]);
			this._tz = params[1];
			this._recur = null;
			this._duration = null;
			this._eventid = uuidv4();
			this._exclude = [];
			this._info = null;
		} else {
			this._inner = moment.unix(params[0].timestamp()).tz(params[0].timezone());
			this._tz = params[0].timezone();
			this._recur = params[0]._recur;
			this._duration = params[0]._duration;
			this._eventid = params[0]._eventid;
			this._exclude = params[0]._exclude;
			this._info = params[0]._info;
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

	/**
	 * Gets the weekday number for the event
	 * @returns The weekday number
	 */
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
	public for_(duration: EventDurationInput): Event<InfoT> {
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
	 * The event ID for this event. Recurring events have the same event ID.
	 */
	public get event_id(): string {
		return this._eventid;
	}

	/**
	 * The event info for this event.
	 */
	public get info(): InfoT {
		return this._info;
	}

	/**
	 * Returns an event with the recurrence value set. This does modify in place.
	 * @param recur - The recurrence settings
	 * @returns The same event with recurrence modified. This does NOT create a clone.
	 */
	public every(recur: Recurrence): Event<InfoT> {
		this._recur = recur;

		return this;
	}

	/**
	 * Returns an event with the specified timestamp excluded. This does modify in place.
	 * @param date - The date of the timestamp
	 * @param time - The time of day
	 * @param tz - The timezone
	 * @returns The same event with an exception rule added. This does NOT create a clone.
	 */
	public except(date: string, time: string, tz: string): Event<InfoT> {
		this._exclude.push(moment.tz(`${date} ${time}`, tz).unix());

		return this;
	}

	/**
	 * Returns an event with the info modified. This does NOT modify in place, it creates a clone.
	 * @param info The info object
	 * @returns The modified event containing the info
	 */
	public with_info<I extends object>(info: I): Event<I> {
		// This is EXTREMELY hacky but it works
		const clone: Event<InfoT | I> = new Event(this);
		clone._info = info;
		return clone as Event<I>;
	}

	/**
	 * Adds the duration to the internal Moment. This DOES NOT create a clone. This modified in place.
	 * @param duration - The duration
	 * @returns The event to be used in a builder pattern.
	 */
	private plus(duration: DurationInputObject): Event<InfoT> {
		this._inner = this._inner.add(duration);

		return this;
	}

	/**
	 * Given a recurrence rule, get the duration to the next event in the series.
	 * @param recur - The recurrence rule set
	 * @returns The duration to be used with Moment.js
	 */
	private duration_to_next(recur: Recurrence): DurationInputObject {
		const weekdays = (this._recur.weekdays || []).map((s) => WEEKDAYS.indexOf(s));
		if (this._recur.weekday) {
			weekdays.push(WEEKDAYS.indexOf(this._recur.weekday));
		}

		if (weekdays.length == 0) {
			return {
				weeks: recur.weeks
			};
		}

		const weekday = this.weekday_num();

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
	public next(count: number): Event<InfoT>[] {
		let clone = new Event(this);

		if (this._recur == null) {
			return [clone];
		}

		const out = [];

		for (let i = 0; i < count; i++) {
			clone._exclude = clone._exclude.filter((v) => v > clone.timestamp());

			out.push(new Event(clone));

			do {
				clone = clone.plus(clone.duration_to_next(this._recur));
			} while (this._exclude.indexOf(clone.timestamp()) != -1);
		}

		return out;
	}

	/**
	 * Gets the next event after the specified date
	 * @param params The arguments, either [date, tz] or [date, time, tz]
	 * @returns The next valid event. This does create a full clone.
	 */
	public next_after(...params: NextEventAfterParams): Event<InfoT> | null {
		let stamp_min: number;

		if (params.length == 2) {
			stamp_min = moment.tz(`${params[0]} 23:59`, params[1]).unix();
		} else {
			// Date, time, and timezone
			stamp_min = moment.tz(`${params[0]} ${params[1]}`, params[2]).unix();
		}

		const search_stamp = this.timestamp();

		if (this._recur == null) {
			if (search_stamp > stamp_min) return new Event(this);
			return null;
		}

		const days_until = Math.floor((stamp_min - search_stamp) / SECONDS_IN_DAY);
		let weeks_until = Math.floor(days_until / 7);

		if (this._recur.weeks > 1) {
			// weeks_until needs to be a multiple of the weeks counter, round down incase of other weekdays
			weeks_until = Math.floor(weeks_until / this._recur.weeks) * this._recur.weeks;
		}

		let next_check = new Event(this);
		next_check._inner = next_check._inner.add(weeks_until, 'weeks');

		do {
			next_check = next_check.plus(next_check.duration_to_next(next_check._recur));
		} while (next_check.timestamp() <= stamp_min);

		return next_check;
	}

	/**
	 * Gets all of the events before a specific date.
	 * @param date - The maximum date. This is not inclusive. If there is an event on March 1st and the limit is March 1st, that event is not included.
	 * @returns The list of events
	 */
	public all_before(date: string): Event<InfoT>[] {
		const out = this.next(2);

		if (out.length == 1) {
			return out;
		}

		let last = out.pop();

		while (last.timestamp() < new Event(date, '00:00', this._tz).timestamp()) {
			const nexts = last.next(2);

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
		let out: EventJSON<InfoT> = {
			date: `${this.year()}-${two_digits(this.month())}-${two_digits(this.day())}`,
			time: `${two_digits(this.hour())}:${two_digits(this.minute())}`,
			tz: this._tz,
			recurs: this._recur,
			event_id: this._eventid,
			exclude: this._exclude
		};

		if (this._info !== null) {
			out = {
				...out,
				info: this._info
			};
		}

		return JSON.stringify(out);
	}

	/**
	 * Creates an event from a JSON string
	 * @param json - The JSON string
	 * @returns The new event
	 */
	public static fromJSON<InfoT extends object>(json: string): Event<InfoT> {
		const obj: EventJSON<InfoT> = JSON.parse(json);

		const event = new Event(obj.date, obj.time, obj.tz);
		event._eventid = obj.event_id;
		event._exclude = obj.exclude;
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

		const end_other = other._inner.clone().add({ minutes: other._duration.minutes });
		const end_this = this._inner.clone().add({ minutes: this._duration.minutes });

		if (end_this.unix() > other.timestamp() && this.timestamp() <= other.timestamp()) {
			return true;
		}

		return end_other.unix() > this.timestamp() && other.timestamp() <= this.timestamp();
	}

	[util.inspect.custom]() {
		return `${this.year()}-${two_digits(this.month())}-${two_digits(this.day())} ${two_digits(this.hour())}:${two_digits(this.minute())} ${this.timezone()}`;
	}
}

/* eslint-disable  @typescript-eslint/no-namespace */
export namespace EventType {
	export type WithInfo<I extends object> = Event<I>;
}
