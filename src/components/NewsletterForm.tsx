"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setState("done");
      setMsg(json.message);
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (state === "done")
    return (
      <p className={`flex items-center gap-2 text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
        <Check className="h-5 w-5 text-seaglass" /> {msg}
      </p>
    );

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className={`flex items-center gap-2 rounded-full p-1.5 pl-5 ${dark ? "bg-white/10 ring-1 ring-white/25" : "bg-white ring-1 ring-line"}`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className={`w-full bg-transparent text-[15px] font-medium outline-none ${dark ? "text-white placeholder:text-white/60" : "placeholder:text-muted"}`}
        />
        <button disabled={state === "sending"} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-buoy px-5 py-3 text-sm font-bold text-white transition hover:bg-buoy-dark disabled:opacity-60">
          {state === "sending" ? "Joining…" : "Sign me up"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-sm font-semibold text-buoy">{msg}</p>}
      <p className={`mt-2 pl-5 text-xs ${dark ? "text-white/60" : "text-muted"}`}>One email every Thursday. Unsubscribe anytime.</p>
    </form>
  );
}
