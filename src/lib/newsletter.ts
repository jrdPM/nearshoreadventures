import type { CapeEvent } from "./types";
import { applyFilters, EMPTY_FILTERS } from "./filters";
import { CATEGORY_BY_ID } from "./categories";
import { TOWN_BY_SLUG } from "./towns";
import { addDays, dayKey, fmt, nowZoned, presetRange, startOfDay, timeLabel, zonedToUtc, endOfDay } from "./dates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nearshoreadventures.com";

export interface Digest {
  subject: string;
  preview: string;
  weekOf: string;
  picks: CapeEvent[];
  days: { label: string; events: CapeEvent[] }[];
  free: CapeEvent[];
  boat: CapeEvent[];
  total: number;
}

/** Give a little lift to the kinds of things people forward to friends. */
function score(e: CapeEvent) {
  let s = 0;
  if (e.categories.includes("festivals")) s += 4;
  if (e.categories.includes("music")) s += 2;
  if (e.categories.includes("food")) s += 2;
  if (e.tags.free) s += 1;
  if (e.tags.byBoat) s += 1;
  if (e.image) s += 1;
  if (e.summary.length > 60) s += 1;
  if (e.categories.includes("seniors") || e.categories.includes("classes")) s -= 1; // great, but they're in the day list
  return s;
}

/** Pick a spread of towns, not five things in Hyannis. */
function diversePicks(events: CapeEvent[], n: number) {
  const seenTitles = new Set<string>();
  const unique = events.filter((e) => !seenTitles.has(e.title) && seenTitles.add(e.title));
  const ranked = [...unique].sort((a, b) => score(b) - score(a) || a.start.localeCompare(b.start));
  const out: CapeEvent[] = [];
  const towns = new Map<string, number>();
  for (const e of ranked) {
    if ((towns.get(e.venue.town) ?? 0) >= 2) continue;
    out.push(e);
    towns.set(e.venue.town, (towns.get(e.venue.town) ?? 0) + 1);
    if (out.length === n) break;
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

export function buildDigest(all: CapeEvent[], now = nowZoned()): Digest {
  const weekend = applyFilters(all, { ...EMPTY_FILTERS, date: "weekend" });
  // Thursday through next Wednesday.
  const from = zonedToUtc(startOfDay(now));
  const to = zonedToUtc(endOfDay(addDays(now, 6)));
  const week = all.filter((e) => new Date(e.end ?? e.start) >= from && new Date(e.start) <= to);
  const picks = diversePicks(weekend.length >= 4 ? weekend : week, 6);
  const pickIds = new Set(picks.map((p) => p.id));

  const days: Digest["days"] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(now, i);
    const k = dayKey(zonedToUtc(d));
    const evs = week.filter((e) => dayKey(e.start) === k && !pickIds.has(e.id)).slice(0, 8);
    if (evs.length) days.push({ label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : fmt(zonedToUtc(d), "EEEE, MMM d"), events: evs });
  }

  const wk = presetRange("week", now)!;
  const free = all.filter((e) => e.tags.free && !pickIds.has(e.id) && new Date(e.start) >= wk[0] && new Date(e.start) <= wk[1]).slice(0, 5);
  const boat = all.filter((e) => e.tags.byBoat && !pickIds.has(e.id) && new Date(e.start) >= wk[0] && new Date(e.start) <= addDays(wk[1], 7)).slice(0, 4);

  const headline = picks[0]?.title;
  return {
    subject: headline ? `This weekend on the Cape: ${headline} and more` : "This week on the Cape",
    preview: `${week.length} things happening across the Cape this week, from ${picks.map((p) => TOWN_BY_SLUG[p.venue.town]?.name).filter(Boolean).slice(0, 3).join(" to ")}.`,
    weekOf: fmt(zonedToUtc(now), "MMMM d, yyyy"),
    picks,
    days,
    free,
    boat,
    total: week.length,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const link = (e: CapeEvent) => `${SITE}/events/${e.slug}?utm_source=newsletter&utm_medium=email`;
const when = (e: CapeEvent) => `${fmt(e.start, "EEE, MMM d")}${e.allDay ? "" : ` · ${timeLabel(e.start)}`}`;
const where = (e: CapeEvent) => `${esc(e.venue.name)}, ${TOWN_BY_SLUG[e.venue.town]?.name ?? ""}`;

/** Email-safe HTML (tables + inline styles). Works in Beehiiv, Gmail, Apple Mail, Outlook. */
export function renderEmailHtml(d: Digest) {
  const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;";
  const pick = (e: CapeEvent) => {
    const cat = CATEGORY_BY_ID[e.categories[0]];
    return `<tr><td style="padding:0 0 24px 0;">
      <a href="${link(e)}" style="text-decoration:none;color:#0e2233;">
        <img src="${esc(e.image || cat.photo)}" width="536" alt="" style="width:100%;max-width:536px;height:auto;border-radius:14px;display:block;background:#f7f4ef;" />
        <p style="${font}margin:12px 0 2px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e8553d;">${esc(cat.short)} · ${esc(TOWN_BY_SLUG[e.venue.town]?.name ?? "")}</p>
        <p style="${font}margin:0;font-size:20px;font-weight:800;line-height:1.25;">${esc(e.title)}</p>
        <p style="${font}margin:4px 0 0;font-size:14px;color:#3d4d5c;">${when(e)} · ${where(e)}${e.tags.free ? " · Free" : ""}</p>
        ${e.summary ? `<p style="${font}margin:8px 0 0;font-size:15px;line-height:1.5;color:#3d4d5c;">${esc(e.summary)}</p>` : ""}
      </a></td></tr>`;
  };
  const line = (e: CapeEvent) =>
    `<tr><td style="${font}padding:8px 0;border-bottom:1px solid #e8e4dd;font-size:15px;line-height:1.4;">
      <a href="${link(e)}" style="color:#0e2233;font-weight:700;text-decoration:none;">${esc(e.title)}</a><br/>
      <span style="color:#6b7a87;font-size:13px;">${e.allDay ? "All day" : timeLabel(e.start)} · ${where(e)}${e.tags.free ? " · Free" : ""}</span>
    </td></tr>`;
  const h2 = (t: string) => `<tr><td style="${font}padding:28px 0 8px;font-size:22px;font-weight:800;color:#0e2233;">${t}</td></tr>`;

  return `<!doctype html><html><body style="margin:0;background:#f7f4ef;">
<span style="display:none;max-height:0;overflow:hidden;">${esc(d.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;">
<tr><td style="padding:28px 32px 0;">
  <p style="${font}margin:0;font-size:18px;font-weight:800;color:#0e2233;">nearshore <span style="color:#e8553d;font-size:11px;letter-spacing:.2em;text-transform:uppercase;">adventures</span></p>
  <p style="${font}margin:18px 0 0;font-size:28px;font-weight:800;line-height:1.15;color:#0e2233;">Your week on the Cape</p>
  <p style="${font}margin:8px 0 0;font-size:15px;line-height:1.5;color:#3d4d5c;">Happy Thursday. We found ${d.total} things going on between now and next Wednesday. Here’s what we’d put on the fridge.</p>
</td></tr>
<tr><td style="padding:8px 32px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${h2("This weekend’s picks")}
  ${d.picks.map(pick).join("")}
  ${d.boat.length ? h2("⚓ Reachable by boat") + d.boat.map(line).join("") : ""}
  ${d.free.length ? h2("Free and easy") + d.free.map(line).join("") : ""}
  ${d.days.length ? h2("The rest of the week") + d.days.map((day) => `<tr><td style="${font}padding:16px 0 4px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#e8553d;">${esc(day.label)}</td></tr>${day.events.map(line).join("")}`).join("") : ""}
  <tr><td align="center" style="padding:32px 0 8px;"><a href="${SITE}/explore?utm_source=newsletter&utm_medium=email" style="${font}display:inline-block;background:#0e2233;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 26px;border-radius:999px;">See everything on the calendar</a></td></tr>
</table></td></tr>
<tr><td style="${font}padding:20px 32px 28px;font-size:12px;line-height:1.5;color:#6b7a87;border-top:1px solid #e8e4dd;">
  Know about something we missed? <a href="${SITE}/submit" style="color:#0e2233;">Add it here</a>. Plans change, so check the organizer’s page before you go.
</td></tr>
</table></td></tr></table></body></html>`;
}
