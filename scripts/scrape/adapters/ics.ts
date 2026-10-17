/** iCalendar feeds (.ics / webcal). Town calendars, libraries and Google Calendars all publish these. */
import ical, { type VEvent } from "node-ical";
import type { RawEvent } from "../raw";
import { getText } from "../fetch";

const HORIZON_DAYS = 120;

function str(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "val" in v) return String((v as { val: unknown }).val);
  return String(v);
}

export async function fetchIcs(feedUrl: string): Promise<RawEvent[]> {
  const text = await getText(feedUrl.replace(/^webcal:/, "https:"), "text/calendar,*/*;q=0.5");
  if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Not an iCalendar feed");
  const data = ical.sync.parseICS(text);
  const now = new Date();
  const until = new Date(now.getTime() + HORIZON_DAYS * 86400_000);
  const out: RawEvent[] = [];

  for (const item of Object.values(data)) {
    if (!item || item.type !== "VEVENT") continue;
    const ev = item as VEvent;
    const allDay = (ev as unknown as { datetype?: string }).datetype === "date";
    const durationMs = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;
    const base: Omit<RawEvent, "start" | "end"> = {
      title: str(ev.summary) ?? "Untitled event",
      description: str(ev.description),
      url: str(ev.url),
      address: str(ev.location),
      venueName: str(ev.location)?.split(",")[0],
      allDay,
    };
    const asStart = (d: Date) => (allDay ? d.toISOString().slice(0, 10) : d.toISOString());

    if (ev.rrule) {
      const exdates = new Set(Object.values(ev.exdate ?? {}).map((d) => new Date(d as Date).toDateString()));
      for (const occ of ev.rrule.between(now, until, true).slice(0, 60)) {
        if (exdates.has(occ.toDateString())) continue;
        out.push({ ...base, start: asStart(occ), end: durationMs ? asStart(new Date(occ.getTime() + durationMs)) : undefined });
      }
    } else if (ev.start && ev.start <= until && (ev.end ?? ev.start) >= now) {
      out.push({ ...base, start: asStart(ev.start), end: ev.end ? asStart(ev.end) : undefined });
    }
  }
  return out;
}
