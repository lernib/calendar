import { Event, EventConstructorParams, NextEventAfterParams } from './event.js';

export class Calendar {
	private _events: Event[];

	public constructor(events?: Event[]) {
		this._events = events || [];
	}

	public get events(): Event[] {
		return this._events;
	}

	/**
	 * Insert an event into the calendar. This can be modified after the fact without re-insertion.
	 * @param params The arguments for creating the initial event.
	 * @returns The event that can be modified in-place.
	 */
	public insert_at(...params: EventConstructorParams): Event {
		const event = new Event(...params);

		let loc = 0;

		// TODO: Use binary search instead
		for (const old_event of this._events) {
			if (old_event.timestamp() < event.timestamp()) {
				loc += 1;
			} else {
				break;
			}
		}

		this._events.splice(loc, 0, event);

		return event;
	}

	/**
	 * Gets all events in the calendar before a specific date.
	 * @param date The date to get events before.
	 * @returns All events before that date.
	 */
	public all_before(date: string): Event[] {
		const events = this._events
			.flatMap((e) => e.all_before(date))
			.sort((a, b) => a.timestamp() - b.timestamp());

		return events;
	}

	/**
	 * Moves the calendar to after the specified date/datetime.
	 * @param params The arguments to Event.next_after
	 * @returns The updated calendar. This creates a clone.
	 */
	public after(...params: NextEventAfterParams): Calendar {
		const events = this._events.map((e) => e.next_after(...params));
		return new Calendar(events);
	}
}
