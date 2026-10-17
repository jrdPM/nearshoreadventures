import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const TZ = "America/New_York";

export const fmt = (iso: string | Date, pattern: string) => formatInTimeZone(iso, TZ, pattern);

/** "Sat, Oct 24" */
export const dayLabel = (iso: string) => fmt(iso, "EEE, MMM d");
/** "7:00 PM" or "7 PM" */
export function timeLabel(iso: string) {
  const m = fmt(iso, "mm");
  return m === "00" ? fmt(iso, "h a") : fmt(iso, "h:mm a");
}

export function whenLabel(e: { start: string; end?: string; allDay: boolean }) {
  const startDay = fmt(e.start, "yyyy-MM-dd");
  const endDay = e.end ? fmt(e.end, "yyyy-MM-dd") : startDay;
  if (startDay !== endDay) {
    const sameMonth = fmt(e.start, "yyyy-MM") === fmt(e.end!, "yyyy-MM");
    return `${fmt(e.start, "MMM d")} – ${fmt(e.end!, sameMonth ? "d" : "MMM d")}`;
  }
  if (e.allDay) return `${dayLabel(e.start)} · All day`;
  return `${dayLabel(e.start)} · ${timeLabel(e.start)}${e.end ? ` – ${timeLabel(e.end)}` : ""}`;
}

/** "yyyy-MM-dd" of an instant, in Cape Cod time */
export const dayKey = (d: string | Date) => fmt(d, "yyyy-MM-dd");

/** The current moment as a Date whose wall clock reads Cape Cod time (for date-fns math). */
export const nowZoned = () => toZonedTime(new Date(), TZ);
export const zonedToUtc = (d: Date) => fromZonedTime(d, TZ);

export type DatePreset = "today" | "tomorrow" | "weekend" | "week" | "month" | "all";

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "This month" },
];

/** Returns [from, to] as UTC Dates for a preset, relative to "now" on the Cape. */
export function presetRange(p: DatePreset, now = nowZoned()): [Date, Date] | null {
  switch (p) {
    case "today":
      return [zonedToUtc(startOfDay(now)), zonedToUtc(endOfDay(now))];
    case "tomorrow": {
      const t = addDays(now, 1);
      return [zonedToUtc(startOfDay(t)), zonedToUtc(endOfDay(t))];
    }
    case "weekend": {
      // Friday 5pm through Sunday night. If it's already the weekend, start now.
      const dow = now.getDay(); // 0 Sun .. 6 Sat
      const toFri = dow === 0 ? -2 : 5 - dow;
      const fri = addDays(startOfDay(now), dow === 6 ? -1 : toFri);
      fri.setHours(17);
      const sun = endOfDay(addDays(fri, 2));
      return [zonedToUtc(fri > now ? fri : now), zonedToUtc(sun)];
    }
    case "week":
      return [zonedToUtc(startOfDay(now)), zonedToUtc(endOfDay(addDays(now, 6)))];
    case "month":
      return [zonedToUtc(startOfDay(now)), zonedToUtc(endOfMonth(now))];
    default:
      return null;
  }
}

export { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
