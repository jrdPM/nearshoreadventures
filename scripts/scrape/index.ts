/**
 * The event round-up. Runs on a schedule (see .github/workflows/scrape.yml):
 *   1. Pull every enabled source in data/sources.json
 *   2. Clean up and categorize what we find
 *   3. Publish the good stuff, queue the iffy stuff for review
 *   4. Write data/events.json, data/review-queue.json and data/scrape-report.json
 *
 * Usage: npm run scrape            (all sources)
 *        npm run scrape -- chamber (only sources whose id contains "chamber")
 */
import type { CapeEvent, ReviewItem, Source } from "../../src/lib/types";
import { fmt } from "../../src/lib/dates";
import { fetchTribe } from "./adapters/tribe";
import { fetchIcs } from "./adapters/ics";
import { parseJsonLd, discoverFeeds } from "./adapters/jsonld";
import { aiEnabled, extractWithAi } from "./adapters/ai";
import { get } from "./fetch";
import { normalize, type Normalized } from "./normalize";
import { geocodeAll } from "./geocode";
import { store } from "./store";
import type { RawEvent } from "./raw";

interface SourceReport {
  id: string;
  name: string;
  ok: boolean;
  method?: string;
  found: number;
  published: number;
  queued: number;
  error?: string;
}

async function pull(source: Source): Promise<{ raw: RawEvent[]; method: string }> {
  const today = fmt(new Date(), "yyyy-MM-dd");
  const t = source.type;
  if (t === "tribe") return { raw: await fetchTribe(source.url, source.feed), method: "tribe" };
  if (t === "ics") return { raw: await fetchIcs(source.feed ?? source.url), method: "ics" };

  // "auto", "jsonld" and "ai" all start by loading the page.
  if (t === "auto") {
    try {
      const raw = await fetchTribe(source.url, source.feed);
      if (raw.length) return { raw, method: "tribe" };
    } catch {
      /* not a Tribe site */
    }
  }
  const res = await get(source.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  if (t === "auto" || t === "jsonld") {
    const ld = parseJsonLd(html, source.url);
    if (ld.length) return { raw: ld, method: "jsonld" };
  }
  if (t === "auto") {
    for (const feed of discoverFeeds(html, source.url)) {
      try {
        const raw = await fetchIcs(feed);
        if (raw.length) return { raw, method: `ics (${feed})` };
      } catch {
        /* keep looking */
      }
    }
  }
  if ((t === "auto" || t === "ai") && aiEnabled()) {
    return { raw: await extractWithAi(html, source.url, today), method: "ai" };
  }
  return { raw: [], method: aiEnabled() ? "none" : "none (no AI key for plain pages)" };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/** When two sources list the same event, keep the better listing. */
function better(a: Normalized, b: Normalized) {
  const score = (n: Normalized) =>
    (n.event.trusted ? 100 : 0) - n.reasons.length * 10 + (n.event.summary.length > 40 ? 5 : 0) + (n.event.image ? 3 : 0) + (n.event.venue.address ? 2 : 0);
  return score(b) > score(a) ? b : a;
}

async function main() {
  const only = process.argv[2];
  const nowIso = new Date().toISOString();
  const sources = store.sources().filter((s) => s.enabled && (!only || s.id.includes(only)));
  const existing = store.events();
  const decisions = store.decisions();
  const oldQueue = store.queue();

  console.log(`Pulling ${sources.length} sources${aiEnabled() ? " (AI extraction on)" : ""}…`);
  const reports: SourceReport[] = [];
  const found = new Map<string, Normalized>();
  const okSources = new Set<string>();

  await mapLimit(sources, 4, async (source) => {
    const rep: SourceReport = { id: source.id, name: source.name, ok: false, found: 0, published: 0, queued: 0 };
    reports.push(rep);
    try {
      const { raw, method } = await pull(source);
      rep.ok = true;
      rep.method = method;
      rep.found = raw.length;
      okSources.add(source.id);
      for (const r of raw) {
        const n = normalize(r, source, nowIso);
        if (!n) continue;
        const prev = found.get(n.event.id);
        found.set(n.event.id, prev ? better(prev, n) : n);
      }
      console.log(`  ✓ ${source.name}: ${raw.length} via ${method}`);
    } catch (err) {
      rep.error = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${source.name}: ${rep.error}`);
    }
  });

  const publish = new Map<string, CapeEvent>();
  const queue: ReviewItem[] = [];
  const prevById = new Map(existing.map((e) => [e.id, e]));

  for (const n of found.values()) {
    const decision = decisions[n.event.id];
    if (decision === "rejected") continue;
    const prev = prevById.get(n.event.id);
    if (prev) n.event.firstSeen = prev.firstSeen;
    const rep = reports.find((r) => r.id === n.event.source.id);
    if (n.reasons.length === 0 || decision === "approved") {
      publish.set(n.event.id, { ...n.event, trusted: true });
      if (rep) rep.published++;
    } else {
      queue.push({ event: n.event, reasons: n.reasons, kind: "scraped", queuedAt: oldQueue.find((q) => q.event.id === n.event.id)?.queuedAt ?? nowIso });
      if (rep) rep.queued++;
    }
  }

  const realEventsExist = publish.size > 0 || existing.some((e) => !e.sample);
  const cutoff = Date.now() - 12 * 3600_000;
  // Keep events we didn't re-check this run (their source failed, or they were submitted by hand).
  for (const e of existing) {
    if (publish.has(e.id)) continue;
    if (e.sample && realEventsExist) continue;
    if (okSources.has(e.source.id)) continue; // source answered and no longer lists it
    if (new Date(e.end ?? e.start).getTime() < cutoff) continue;
    publish.set(e.id, e);
  }

  const events = [...publish.values()].sort((a, b) => a.start.localeCompare(b.start));
  await geocodeAll(events);

  const queuedIds = new Set(queue.map((q) => q.event.id));
  const keptOld = oldQueue.filter(
    (q) =>
      !queuedIds.has(q.event.id) &&
      !publish.has(q.event.id) &&
      !decisions[q.event.id] &&
      (q.kind === "submitted" || !okSources.has(q.event.source.id)) &&
      new Date(q.event.end ?? q.event.start).getTime() > cutoff,
  );
  const finalQueue = [...keptOld, ...queue].sort((a, b) => a.event.start.localeCompare(b.event.start));

  store.saveEvents(events);
  store.saveQueue(finalQueue);
  store.saveReport({
    ranAt: nowIso,
    published: events.length,
    queued: finalQueue.length,
    sourcesOk: reports.filter((r) => r.ok).length,
    sourcesFailed: reports.filter((r) => !r.ok).length,
    sources: reports.sort((a, b) => a.name.localeCompare(b.name)),
  });
  console.log(`Done: ${events.length} published, ${finalQueue.length} waiting for review.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
