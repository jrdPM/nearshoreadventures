"use client";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { Filters, SortId } from "@/lib/filters";
import { EMPTY_FILTERS } from "@/lib/filters";
import { REGIONS, TOWNS } from "@/lib/towns";
import type { RegionId } from "@/lib/types";

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
    >
      {children}
    </button>
  );
}

export function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const flip = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-pop md:max-w-2xl md:rounded-3xl"
      >
        <div className="relative flex items-center justify-center border-b border-line px-6 py-4">
          <button onClick={onClose} className="absolute left-4 grid h-9 w-9 place-items-center rounded-full hover:bg-sand" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold">Filters</h2>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="mb-1 text-lg font-bold">Dates</h3>
            <p className="mb-3 text-sm text-muted">Pick a range, or use the quick picks up top.</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-1 flex-col rounded-xl border border-line px-4 py-2 text-xs font-bold">
                From
                <input type="date" className="mt-1 text-sm font-medium outline-none" value={filters.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined, date: "all" })} />
              </label>
              <label className="flex flex-1 flex-col rounded-xl border border-line px-4 py-2 text-xs font-bold">
                To
                <input type="date" className="mt-1 text-sm font-medium outline-none" value={filters.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined, date: "all" })} />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-bold">Good to know</h3>
            <div className="flex flex-wrap gap-2">
              <Toggle on={filters.free} onClick={() => set({ free: !filters.free })}>Free</Toggle>
              <Toggle on={filters.kids} onClick={() => set({ kids: !filters.kids })}>Kid-friendly</Toggle>
              <Toggle on={filters.seniors} onClick={() => set({ seniors: !filters.seniors })}>Great for seniors</Toggle>
              <Toggle on={filters.outdoor} onClick={() => set({ outdoor: !filters.outdoor })}>Outdoors</Toggle>
              <Toggle on={filters.byBoat} onClick={() => set({ byBoat: !filters.byBoat })}>⚓ Reachable by boat</Toggle>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-bold">Part of the Cape</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(REGIONS) as RegionId[]).map((r) => {
                const on = filters.regions.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => set({ regions: flip(filters.regions, r) })}
                    aria-pressed={on}
                    className={`rounded-2xl border p-4 text-left transition ${on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink"}`}
                  >
                    <span className="block font-bold">{REGIONS[r].name}</span>
                    <span className="block text-xs text-muted">{REGIONS[r].blurb}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-bold">Towns</h3>
            <div className="flex flex-wrap gap-2">
              {TOWNS.map((t) => (
                <Toggle key={t.slug} on={filters.towns.includes(t.slug)} onClick={() => set({ towns: flip(filters.towns, t.slug) })}>
                  {t.name}
                </Toggle>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-bold">Sort by</h3>
            <div className="flex flex-wrap gap-2">
              {([
                ["soonest", "Happening soonest"],
                ["newest", "Just added"],
                ["az", "A to Z"],
              ] as [SortId, string][]).map(([id, label]) => (
                <Toggle key={id} on={filters.sort === id} onClick={() => set({ sort: id })}>{label}</Toggle>
              ))}
            </div>
          </section>
        </div>

        <div className="safe-bottom flex items-center justify-between border-t border-line px-6 py-4">
          <button className="text-sm font-bold underline" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q, categories: filters.categories })}>
            Clear all
          </button>
          <button onClick={onClose} className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink-soft">
            Show {resultCount} event{resultCount === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
