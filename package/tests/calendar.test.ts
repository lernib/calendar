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

describe('calendar access', () => {
	test('get all before date', () => {
		const calendar = new Calendar();

		calendar
			.insert_at('2025-02-25', '11:30', 'America/New_York')
			.every({ weeks: 1 })
			.for_({ hours: 1 })
			.except('2025-03-11', '11:30', 'America/New_York');

		calendar
			.insert_at('2025-02-28', '12:30', 'America/New_York')
			.every({ weeks: 1 })
			.for_({ hours: 1 });

		const EXPECTED = [
			new Event('2025-02-25', '11:30', 'America/New_York'),
			new Event('2025-02-28', '12:30', 'America/New_York'),
			new Event('2025-03-04', '11:30', 'America/New_York'),
			new Event('2025-03-07', '12:30', 'America/New_York'),
			new Event('2025-03-14', '12:30', 'America/New_York'),
			new Event('2025-03-18', '11:30', 'America/New_York'),
			new Event('2025-03-21', '12:30', 'America/New_York'),
			new Event('2025-03-25', '11:30', 'America/New_York'),
			new Event('2025-03-28', '12:30', 'America/New_York')
		].map((e: Event) => e.timestamp());

		const output = calendar.all_before('2025-04-01').map((e) => e.timestamp());

		expect(output).toEqual(EXPECTED);
	});
});
