import { Event, EventConstructorParams } from './event.js';

export class Calendar {
	private _events: Event[];

	public constructor(events?: Event[]) {
		this._events = events || [];
	}

	public get events(): Event[] {
		return this._events;
	}

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
}
