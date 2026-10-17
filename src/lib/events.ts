import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { CapeEvent } from "./types";

let cache: CapeEvent[] | null = null;

/** All published events that haven't finished yet, soonest first. */
export function getEvents(): CapeEvent[] {
  if (!cache) {
    const file = path.join(process.cwd(), "data", "events.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8")) as CapeEvent[];
  }
  const now = Date.now();
  return cache
    .filter((e) => new Date(e.end ?? e.start).getTime() >= now - 6 * 3600_000)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function getEvent(slug: string) {
  return getEvents().find((e) => e.slug === slug);
}

export const hasSampleData = () => getEvents().some((e) => e.sample);
