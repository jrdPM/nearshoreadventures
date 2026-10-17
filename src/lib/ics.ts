import type { CapeEvent } from "./types";
import { fmt } from "./dates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nearshoreadventures.com";

const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

function endOf(e: CapeEvent) {
  if (e.end) return e.end;
  return new Date(new Date(e.start).getTime() + 2 * 3600_000).toISOString();
}

function location(e: CapeEvent) {
  return [e.venue.name, e.venue.address].filter(Boolean).join(", ");
}

export function eventToIcs(e: CapeEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nearshore Adventures//Cape Cod Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@nearshoreadventures`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    e.allDay ? `DTSTART;VALUE=DATE:${fmt(e.start, "yyyyMMdd")}` : `DTSTART:${utcStamp(e.start)}`,
    e.allDay ? `DTEND;VALUE=DATE:${fmt(new Date(new Date(endOf(e)).getTime() + 86400_000), "yyyyMMdd")}` : `DTEND:${utcStamp(endOf(e))}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(`${e.summary}\n\n${SITE}/events/${e.slug}`)}`,
    `LOCATION:${esc(location(e))}`,
    `URL:${SITE}/events/${e.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function googleCalendarUrl(e: CapeEvent) {
  const dates = e.allDay
    ? `${fmt(e.start, "yyyyMMdd")}/${fmt(new Date(new Date(endOf(e)).getTime() + 86400_000), "yyyyMMdd")}`
    : `${utcStamp(e.start)}/${utcStamp(endOf(e))}`;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
    details: `${e.summary}\n\n${SITE}/events/${e.slug}`,
    location: location(e),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function outlookCalendarUrl(e: CapeEvent) {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.start,
    enddt: endOf(e),
    body: `${e.summary}\n\n${SITE}/events/${e.slug}`,
    location: location(e),
    allday: String(e.allDay),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`;
}
