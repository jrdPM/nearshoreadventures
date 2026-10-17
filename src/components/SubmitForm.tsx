"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { TOWNS } from "@/lib/towns";
import { CATEGORIES } from "@/lib/categories";

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-ink focus:ring-1 focus:ring-ink";
const label = "mb-1.5 block text-sm font-bold";

export function SubmitForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setState("done");
      setMsg(json.message);
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "done")
    return (
      <div className="rounded-3xl border border-line p-10 text-center shadow-float">
        <CheckCircle2 className="mx-auto h-12 w-12 text-sea" />
        <h2 className="mt-4 text-2xl font-extrabold">Got it!</h2>
        <p className="mt-2 text-ink-soft">{msg}</p>
        <button onClick={() => setState("idle")} className="mt-6 rounded-full border border-line px-5 py-2.5 text-sm font-bold">Add another</button>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-line p-6 shadow-float md:p-8">
      <div>
        <label className={label} htmlFor="title">Event name *</label>
        <input id="title" name="title" required maxLength={140} className={field} placeholder="Harvest Supper at the Grange" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="date">Date *</label>
          <input id="date" name="date" type="date" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="time">Starts</label>
          <input id="time" name="time" type="time" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="endTime">Ends</label>
          <input id="endTime" name="endTime" type="time" className={field} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="venue">Venue *</label>
          <input id="venue" name="venue" required className={field} placeholder="Brewster Grange Hall" />
        </div>
        <div>
          <label className={label} htmlFor="town">Town *</label>
          <select id="town" name="town" required className={field} defaultValue="">
            <option value="" disabled>Pick a town</option>
            {TOWNS.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={label} htmlFor="address">Street address</label>
        <input id="address" name="address" className={field} placeholder="1999 Main St" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="category">What kind of event?</label>
          <select id="category" name="category" className={field} defaultValue="">
            <option value="">Let us figure it out</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="price">Price</label>
          <input id="price" name="price" className={field} placeholder="Free, $10, $15–$25…" />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="description">Tell people about it</label>
        <textarea id="description" name="description" rows={4} maxLength={2000} className={field} placeholder="A sentence or two is perfect." />
      </div>
      <div>
        <label className={label} htmlFor="url">Link for more info or tickets</label>
        <input id="url" name="url" type="url" className={field} placeholder="https://" />
      </div>
      <div className="border-t border-line pt-5">
        <p className="mb-3 text-sm font-bold">Who&apos;s it from? (optional)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="name" className={field} placeholder="Your name" aria-label="Your name" />
          <input name="org" className={field} placeholder="Organization" aria-label="Organization" />
        </div>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state === "error" && <p className="text-sm font-semibold text-buoy">{msg}</p>}
      <button disabled={state === "sending"} className="w-full rounded-xl bg-buoy py-4 text-[15px] font-bold text-white hover:bg-buoy-dark disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Submit event"}
      </button>
    </form>
  );
}
