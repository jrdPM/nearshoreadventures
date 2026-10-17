import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, toIso, categorize } from "./normalize";
import { parseJsonLd } from "./adapters/jsonld";
import { matchTown } from "../../src/lib/towns";
import type { Source } from "../../src/lib/types";

const src: Source = { id: "t", name: "Test", url: "https://example.org", type: "auto", trusted: true, enabled: true };
const future = new Date(Date.now() + 10 * 86400_000).toISOString().slice(0, 10);

test("villages map to their town", () => {
  assert.equal(matchTown("123 Main St, Hyannis, MA")?.slug, "barnstable");
  assert.equal(matchTown("Woods Hole")?.slug, "falmouth");
  assert.equal(matchTown("Boston, MA"), undefined);
});

test("naive local times are read as Cape Cod time", () => {
  const [iso, allDay] = toIso("2026-07-04T19:00")!;
  assert.equal(iso, "2026-07-04T23:00:00.000Z");
  assert.equal(allDay, false);
  assert.equal(toIso("2026-12-05")![1], true);
});

test("keywords pick categories", () => {
  assert.deepEqual(categorize("Live jazz concert on the lawn").slice(0, 1), ["music"]);
  assert.ok(categorize("Council on Aging tai chi").includes("seniors"));
});

test("a clean listing from a trusted source has no review reasons", () => {
  const n = normalize({ title: "Harbor Jazz Night", start: `${future}T19:00`, url: "https://example.org/e", venueName: "Bismore Park", city: "Hyannis" }, src, new Date().toISOString())!;
  assert.equal(n.reasons.length, 0);
  assert.equal(n.event.venue.town, "barnstable");
  assert.equal(n.event.tags.byBoat, true);
});

test("events off the Cape are dropped, untrusted ones are flagged", () => {
  assert.equal(normalize({ title: "Boston thing", start: `${future}T19:00`, city: "Boston" }, { ...src, town: undefined }, ""), null);
  const n = normalize({ title: "Fair", start: future, city: "Orleans", url: "https://x.org" }, { ...src, trusted: false }, "")!;
  assert.ok(n.reasons.some((r) => r.includes("trusted")));
});

test("schema.org Event markup is read", () => {
  const html = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"MusicEvent","name":"Folk Night","startDate":"${future}T20:00:00-04:00","location":{"@type":"Place","name":"Payomet","address":{"addressLocality":"North Truro"}},"offers":{"price":"25","url":"https://tix"}}]}</script>`;
  const [e] = parseJsonLd(html, "https://payomet.org");
  assert.equal(e.title, "Folk Night");
  assert.equal(e.city, "North Truro");
  assert.equal(e.price, "$25");
});
