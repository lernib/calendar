import { describe, test, expect } from 'vitest';

import Calendar, { Event } from '$src/index.js';

describe('calendar initialization', () => {
	test('base initialization', () => {
		const calendar = new Calendar();

		expect(calendar.events).toHaveLength(0);
	});

	test('event initialization', () => {
		const calendar = new Calendar([
			new Event('2025-02-25', '11:30', 'America/New_York'),
			new Event('2025-02-25', '13:00', 'America/New_York'),
			new Event('2025-02-25', '17:30', 'America/New_York')
		]);

		expect(calendar.events).toHaveLength(3);
	});
});

describe('calendar manipulation', () => {
	test('insert an event', () => {
		const calendar = new Calendar([
			new Event('2025-02-25', '11:30', 'America/New_York'),
			new Event('2025-02-25', '13:00', 'America/New_York'),
			new Event('2025-02-26', '10:00', 'America/New_York')
		]);

		const event = calendar
			.insert_at('2025-02-25', '17:30', 'America/New_York')
			.every({ weeks: 1 })
			.for_({ hours: 1 });

		const EXPECTED = [
			new Event('2025-02-25', '11:30', 'America/New_York'),
			new Event('2025-02-25', '13:00', 'America/New_York'),
			new Event('2025-02-25', '17:30', 'America/New_York'),
			new Event('2025-02-26', '10:00', 'America/New_York')
		].map((e: Event) => e.timestamp());

		expect(event.timestamp()).toEqual(
			new Event('2025-02-25', '17:30', 'America/New_York').timestamp()
		);

		expect(calendar.events).toHaveLength(4);
		expect(calendar.events.map((e: Event) => e.timestamp())).toEqual(EXPECTED);
		expect(calendar.events[2].duration.minutes).toEqual(60);
	});
});
