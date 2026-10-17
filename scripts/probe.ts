/**
 * Check candidate event pages before adding them to data/sources.json.
 * Usage: npm run probe -- <url> [url...]
 * For each page: robots.txt, HTTP status, and how many events each method finds (and how many are on the Cape).
 * When a page is missing or empty, lists links on it (or its homepage) that look like event calendars.
 */
import * as cheerio from "cheerio";
import { allowedByRobots, get } from "./scrape/fetch";
import { fetchTribe } from "./scrape/adapters/tribe";
import { fetchIcs } from "./scrape/adapters/ics";
import { parseJsonLd, discoverFeeds } from "./scrape/adapters/jsonld";
import { normalize } from "./scrape/normalize";
import type { RawEvent } from "./scrape/raw";
import type { Source } from "../src/lib/types";

const probeSource = (url: string): Source => ({ id: "probe", name: "Probe", url, type: "auto", trusted: true, enabled: true });

function capeCount(raw: RawEvent[], url: string) {
  return raw.map((r) => normalize(r, probeSource(url), new Date().toISOString())).filter(Boolean).length;
}

function eventLinks(html: string, base: string) {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href")!;
    const text = $(a).text().trim().replace(/\s+/g, " ");
    if (/event|calendar|happening|what.?s.?on|program|show/i.test(href + " " + text)) {
      try {
        links.add(`${new URL(href, base).toString()}  "${text.slice(0, 40)}"`);
      } catch {
        /* skip */
      }
    }
  });
  return [...links].slice(0, 12);
}

async function probe(url: string) {
  console.log(`\n=== ${url}`);
  if (!(await allowedByRobots(url))) {
    console.log("  robots.txt: BLOCKED for us");
    return;
  }
  try {
    const raw = await fetchTribe(url, undefined, 2);
    if (raw.length) console.log(`  tribe API: ${raw.length} events, ${capeCount(raw, url)} on the Cape`);
  } catch {
    /* not tribe */
  }
  let res: Response;
  try {
    res = await get(url);
  } catch (e) {
    console.log(`  fetch failed: ${(e as Error).message}`);
    return;
  }
  console.log(`  HTTP ${res.status}${res.url !== url ? ` -> ${res.url}` : ""}`);
  const html = await res.text();
  if (html.trimStart().startsWith("BEGIN:VCALENDAR")) {
    const ics = await fetchIcs(url).catch(() => [] as RawEvent[]);
    console.log(`  ics feed: ${ics.length} events, ${capeCount(ics, url)} on the Cape${ics[0] ? ` (e.g. "${ics[0].title}" ${ics[0].start})` : ""}`);
    return;
  }
  const $ = cheerio.load(html);
  console.log(`  title: ${$("title").text().trim().slice(0, 90)}`);
  const ld = parseJsonLd(html, url);
  console.log(`  json-ld: ${ld.length} events, ${capeCount(ld, url)} on the Cape${ld[0] ? ` (e.g. "${ld[0].title}" ${ld[0].start} ${ld[0].city ?? ""})` : ""}`);
  for (const feed of discoverFeeds(html, url)) {
    try {
      const ics = await fetchIcs(feed);
      console.log(`  ics ${feed}: ${ics.length} events, ${capeCount(ics, url)} on the Cape`);
    } catch (e) {
      console.log(`  ics ${feed}: failed (${(e as Error).message})`);
    }
  }
  if (!res.ok || ld.length === 0) {
    let links = eventLinks(html, res.url);
    if (!res.ok) {
      try {
        const home = await get(new URL(url).origin + "/");
        links = eventLinks(await home.text(), home.url);
      } catch {
        /* ignore */
      }
    }
    if (links.length) console.log("  event-looking links:\n    " + links.join("\n    "));
  }
}

const urls = process.argv.slice(2).flatMap((a) => a.split(/[\s,]+/)).filter(Boolean);
(async () => {
  for (const u of urls) await probe(u);
})();
