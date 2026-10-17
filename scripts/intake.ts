/**
 * Applies what came in through the PHP scripts on Cloudways:
 *   data/submissions.json        raw "Add your event" forms  → review queue
 *   data/pending-decisions.json  approve / remove / trust from /admin → events, queue, sources
 * Both files are emptied afterwards. Runs at the start of every deploy.
 */
import fs from "node:fs";
import path from "node:path";
import type { CapeEvent, CategoryId, ReviewItem, Source } from "../src/lib/types";
import { TOWN_BY_SLUG } from "../src/lib/towns";
import { normalize } from "./scrape/normalize";

const dir = path.join(process.cwd(), "data");
const read = <T>(f: string, fallback: T): T => (fs.existsSync(path.join(dir, f)) ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : fallback);
const write = (f: string, d: unknown) => fs.writeFileSync(path.join(dir, f), JSON.stringify(d, null, 2) + "\n");

export interface Submission {
  title?: string;
  date?: string;
  time?: string;
  endTime?: string;
  town?: string;
  venue?: string;
  address?: string;
  description?: string;
  url?: string;
  price?: string;
  category?: CategoryId;
  name?: string;
  org?: string;
  receivedAt?: string;
}

export interface DecisionBatch {
  approve?: string[];
  reject?: string[];
  trustSources?: string[];
  at?: string;
}

export function submissionToReview(b: Submission, nowIso: string): ReviewItem | null {
  if (!b.title?.trim() || !b.date || !b.town || !TOWN_BY_SLUG[b.town] || !b.venue?.trim()) return null;
  const source: Source = {
    id: "submission",
    name: b.org?.trim() || "Community submission",
    url: b.url?.trim() || "https://nearshoreadventures.com/submit/",
    type: "auto",
    trusted: true,
    enabled: true,
  };
  const n = normalize(
    {
      title: b.title.slice(0, 140),
      start: b.time ? `${b.date}T${b.time}` : b.date,
      end: b.time && b.endTime ? `${b.date}T${b.endTime}` : undefined,
      allDay: !b.time,
      description: b.description?.slice(0, 2000),
      url: b.url || undefined,
      venueName: b.venue,
      address: b.address,
      city: TOWN_BY_SLUG[b.town].name,
      price: b.price || undefined,
      categories: b.category ? [b.category] : undefined,
    },
    source,
    nowIso,
  );
  if (!n) return null;
  return {
    event: n.event,
    kind: "submitted",
    reasons: [`Submitted by ${b.name || "someone"}${b.org ? ` (${b.org})` : ""}`],
    submittedBy: { name: b.name, org: b.org },
    queuedAt: b.receivedAt ?? nowIso,
  };
}

export function applyDecisions(
  batches: DecisionBatch[],
  state: { queue: ReviewItem[]; events: CapeEvent[]; decisions: Record<string, "approved" | "rejected">; sources: Source[] },
) {
  let { queue, events, sources } = state;
  const decisions = { ...state.decisions };
  for (const b of batches) {
    const approve = new Set(b.approve ?? []);
    const reject = new Set(b.reject ?? []);
    const trusted = new Set(b.trustSources ?? []);
    // Trusting a source approves everything from it that's waiting.
    for (const q of queue) if (trusted.has(q.event.source.id)) approve.add(q.event.id);
    const publish = queue.filter((q) => approve.has(q.event.id)).map((q) => ({ ...q.event, trusted: true }));
    for (const id of approve) decisions[id] = "approved";
    for (const id of reject) decisions[id] = "rejected";
    const ids = new Set(publish.map((e) => e.id));
    queue = queue.filter((q) => !approve.has(q.event.id) && !reject.has(q.event.id));
    events = [...events.filter((e) => !ids.has(e.id) && !reject.has(e.id)), ...publish].sort((a, b2) => a.start.localeCompare(b2.start));
    sources = sources.map((s) => (trusted.has(s.id) ? { ...s, trusted: true } : s));
  }
  return { queue, events, decisions, sources };
}

function main() {
  const nowIso = new Date().toISOString();
  const subs = read<Submission[]>("submissions.json", []);
  const batches = read<DecisionBatch[]>("pending-decisions.json", []);
  if (!subs.length && !batches.length) return console.log("Nothing to take in.");

  let queue = read<ReviewItem[]>("review-queue.json", []);
  for (const s of subs) {
    const item = submissionToReview(s, nowIso);
    if (item) queue = [...queue.filter((q) => q.event.id !== item.event.id), item];
  }
  const out = applyDecisions(batches, {
    queue,
    events: read<CapeEvent[]>("events.json", []),
    decisions: read("decisions.json", {}),
    sources: read<Source[]>("sources.json", []),
  });
  write("review-queue.json", out.queue);
  write("events.json", out.events);
  write("decisions.json", out.decisions);
  write("sources.json", out.sources);
  write("submissions.json", []);
  write("pending-decisions.json", []);
  console.log(`Took in ${subs.length} submission(s) and ${batches.length} review batch(es).`);
}

if (process.argv[1]?.endsWith("intake.ts")) main();
