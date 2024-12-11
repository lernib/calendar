import { Event } from "../build/src/index.js";

const start = new Event("2025-01-01", "12:00", "America/New_York").every({
  weeks: 1,
});

console.info(start.next(10));
