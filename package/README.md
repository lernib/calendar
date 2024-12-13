# @lernib/calendar

This library handles various event recurrence shenanigans. We use it to help keep track of things like session times across timezones and billing dates.

## Install

```
npm i @lernib/calendar
```

## Usage

```
import { Event } from "@lernib/calendar";

const start = new Event("2025-01-01", "12:00", "America/New_York").every({
  weeks: 1,
});

// Get the next 10 sessions, including the first one
console.info(start.next(10));
```
