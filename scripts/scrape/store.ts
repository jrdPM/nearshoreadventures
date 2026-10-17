import fs from "node:fs";
import path from "node:path";
import type { CapeEvent, ReviewItem, Source } from "../../src/lib/types";

const dir = path.join(process.cwd(), "data");
const read = <T>(name: string, fallback: T): T => {
  const f = path.join(dir, name);
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as T) : fallback;
};
const write = (name: string, data: unknown) => fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2) + "\n");

export type Decisions = Record<string, "approved" | "rejected">;

export const store = {
  sources: () => read<Source[]>("sources.json", []),
  events: () => read<CapeEvent[]>("events.json", []),
  queue: () => read<ReviewItem[]>("review-queue.json", []),
  decisions: () => read<Decisions>("decisions.json", {}),
  saveEvents: (e: CapeEvent[]) => write("events.json", e),
  saveQueue: (q: ReviewItem[]) => write("review-queue.json", q),
  saveReport: (r: unknown) => write("scrape-report.json", r),
};
