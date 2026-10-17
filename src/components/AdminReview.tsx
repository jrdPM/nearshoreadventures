"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, ShieldCheck, X } from "lucide-react";
import type { ReviewItem, Source } from "@/lib/types";
import { TOWN_BY_SLUG } from "@/lib/towns";
import { whenLabel } from "@/lib/dates";

interface Report {
  ranAt: string;
  published: number;
  queued: number;
  sourcesOk: number;
  sourcesFailed: number;
  sources: { id: string; name: string; ok: boolean; found: number; published: number; queued: number; method?: string; error?: string }[];
}

type Choice = "approve" | "reject";

/** The PHP side can fail with an HTML error page; show its status instead of failing silently. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same loose type res.json() gives
async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { error: `The server had a problem (HTTP ${res.status}). Tell Claude in the project thread.` };
  }
}

export function AdminReview() {
  const [needLogin, setNeedLogin] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [data, setData] = useState<{ queue: ReviewItem[]; report: Report | null; sources: Source[] } | null>(null);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [trust, setTrust] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  async function load() {
    const res = await fetch("/api/admin-queue.php", { cache: "no-store" });
    if (res.status === 401) return setNeedLogin(true);
    const json = await readJson(res);
    if (!res.ok) return setErr(json.error);
    setNeedLogin(false);
    setData(json);
  }
  useEffect(() => {
    load();
  }, []);

  const bySource = useMemo(() => {
    const m = new Map<string, ReviewItem[]>();
    for (const q of data?.queue ?? []) {
      const k = q.kind === "submitted" ? "submission" : q.event.source.id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(q);
    }
    return [...m.entries()];
  }, [data]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin-login.php", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw.trim() }) });
    const json = await readJson(res);
    if (!res.ok) return setErr(json.error);
    setErr("");
    load();
  }

  async function save() {
    setSaving(true);
    const approve = Object.entries(choices).filter(([, c]) => c === "approve").map(([id]) => id);
    const reject = Object.entries(choices).filter(([, c]) => c === "reject").map(([id]) => id);
    const res = await fetch("/api/admin-review.php", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approve, reject, trustSources: trust }) });
    setSaving(false);
    if (!res.ok) return setErr((await res.json()).error ?? "Save failed");
    setSaved(`Saved. ${approve.length} approved, ${reject.length} removed. The site updates in a couple of minutes.`);
    setChoices({});
    setTrust([]);
    load();
  }

  if (needLogin)
    return (
      <form onSubmit={login} className="mx-auto mt-20 max-w-sm space-y-4 px-4">
        <h1 className="text-2xl font-extrabold">Review queue</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Admin password" className="w-full rounded-xl border border-line px-4 py-3" autoFocus />
        {err && <p className="text-sm font-semibold text-buoy">{err}</p>}
        <button className="w-full rounded-xl bg-ink py-3 font-bold text-white">Sign in</button>
      </form>
    );

  if (!data) return <p className="mx-auto mt-20 max-w-xl px-4 text-center text-muted">{err || "Loading…"}</p>;

  const pending = Object.keys(choices).length + trust.length;
  const r = data.report;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Review queue</h1>
      <p className="mt-1 text-muted">{data.queue.length} waiting. Approve, remove, or trust a whole source so its events go live on their own from now on.</p>

      {r && (
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            ["Last round-up", new Date(r.ranAt).toLocaleString()],
            ["Live events", r.published],
            ["Sources working", `${r.sourcesOk} of ${r.sourcesOk + r.sourcesFailed}`],
            ["Waiting for you", data.queue.length],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl bg-sand p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{k}</p>
              <p className="mt-1 text-lg font-extrabold">{v}</p>
            </div>
          ))}
        </div>
      )}

      {saved && <p className="mt-6 rounded-xl bg-seaglass px-4 py-3 text-sm font-semibold">{saved}</p>}
      {err && <p className="mt-6 rounded-xl bg-buoy/10 px-4 py-3 text-sm font-semibold text-buoy-dark">{err}</p>}

      <div className="mt-8 space-y-10">
        {bySource.map(([sid, items]) => {
          const src = data.sources.find((s) => s.id === sid);
          return (
            <section key={sid}>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-extrabold">{sid === "submission" ? "Submitted by organizers" : src?.name ?? sid}</h2>
                <span className="text-sm text-muted">{items.length}</span>
                <button onClick={() => setChoices((c) => ({ ...c, ...Object.fromEntries(items.map((i) => [i.event.id, "approve" as Choice])) }))} className="ml-auto rounded-full border border-line px-3 py-1.5 text-xs font-bold hover:border-ink">
                  Approve all
                </button>
                {src && !src.trusted && (
                  <button
                    onClick={() => setTrust((t) => (t.includes(sid) ? t.filter((x) => x !== sid) : [...t, sid]))}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${trust.includes(sid) ? "bg-sea text-white" : "border border-line hover:border-ink"}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> {trust.includes(sid) ? "Will trust this source" : "Trust this source"}
                  </button>
                )}
              </div>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {items.map((q) => {
                  const c = choices[q.event.id];
                  const set = (v: Choice) => setChoices((cur) => (cur[q.event.id] === v ? Object.fromEntries(Object.entries(cur).filter(([k]) => k !== q.event.id)) : { ...cur, [q.event.id]: v }));
                  return (
                    <li key={q.event.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${c === "approve" ? "bg-seaglass/40" : c === "reject" ? "bg-buoy/5 opacity-60" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{q.event.title}</p>
                        <p className="text-sm text-muted">
                          {whenLabel(q.event)} · {q.event.venue.name}, {TOWN_BY_SLUG[q.event.venue.town]?.name}
                        </p>
                        {q.event.summary && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{q.event.summary}</p>}
                        <p className="mt-1 text-xs font-semibold text-buoy-dark">{q.reasons.join(" · ")}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <a href={q.event.url} target="_blank" rel="noopener" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-sand" aria-label="Open original">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button onClick={() => set("reject")} className={`grid h-10 w-10 place-items-center rounded-full border ${c === "reject" ? "border-buoy bg-buoy text-white" : "border-line hover:bg-sand"}`} aria-label="Remove">
                          <X className="h-4 w-4" />
                        </button>
                        <button onClick={() => set("approve")} className={`grid h-10 w-10 place-items-center rounded-full border ${c === "approve" ? "border-sea bg-sea text-white" : "border-line hover:bg-sand"}`} aria-label="Approve">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {data.queue.length === 0 && <p className="rounded-2xl bg-sand p-10 text-center text-muted">All caught up. Nothing waiting for review.</p>}
      </div>

      {r && r.sources.some((s) => !s.ok || s.found === 0) && (
        <section className="mt-14">
          <h2 className="mb-3 text-lg font-extrabold">Sources that need a look</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
            {r.sources.filter((s) => !s.ok || s.found === 0).map((s) => (
              <li key={s.id} className="flex justify-between gap-4 p-3">
                <span className="font-semibold">{s.name}</span>
                <span className="text-right text-muted">{s.error ?? `0 events (${s.method})`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pending > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-16 z-40 border-t border-line bg-white p-4 shadow-pop md:bottom-0">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-sm font-semibold">{pending} change{pending === 1 ? "" : "s"} ready</p>
            <button onClick={save} disabled={saving} className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
