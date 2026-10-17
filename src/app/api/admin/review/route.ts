import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { commitJson } from "@/lib/github";
import type { CapeEvent, ReviewItem, Source } from "@/lib/types";

type Decisions = Record<string, "approved" | "rejected">;

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { approve = [], reject = [], trustSources = [] } = (await req.json()) as { approve?: string[]; reject?: string[]; trustSources?: string[] };
  if (!approve.length && !reject.length && !trustSources.length) return NextResponse.json({ ok: true });

  const Q = "data/review-queue.json", E = "data/events.json", D = "data/decisions.json", S = "data/sources.json";
  await commitJson(
    [Q, E, D, S],
    (cur) => {
      const queue = cur[Q] as ReviewItem[];
      const events = cur[E] as CapeEvent[];
      const decisions = cur[D] as Decisions;
      const sources = cur[S] as Source[];
      const approveSet = new Set(approve);
      const trusted = new Set(trustSources);
      // Trusting a source approves everything from it that's waiting.
      for (const q of queue) if (trusted.has(q.event.source.id)) approveSet.add(q.event.id);

      const toPublish = queue.filter((q) => approveSet.has(q.event.id)).map((q) => ({ ...q.event, trusted: true }));
      const done = new Set([...approveSet, ...reject]);
      for (const id of approveSet) decisions[id] = "approved";
      for (const id of reject) decisions[id] = "rejected";
      const ids = new Set(toPublish.map((e) => e.id));
      return {
        [Q]: queue.filter((q) => !done.has(q.event.id)),
        [E]: [...events.filter((e) => !ids.has(e.id)), ...toPublish].sort((a, b) => a.start.localeCompare(b.start)),
        [D]: decisions,
        [S]: sources.map((s) => (trusted.has(s.id) ? { ...s, trusted: true } : s)),
      };
    },
    `Review: ${approve.length} approved, ${reject.length} rejected${trustSources.length ? `, trusted ${trustSources.join(", ")}` : ""}`,
  );
  return NextResponse.json({ ok: true });
}
