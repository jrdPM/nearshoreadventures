"use client";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryBar({ value, onChange }: { value: CategoryId[]; onChange: (v: CategoryId[]) => void }) {
  const items: { id: CategoryId | "all"; label: string }[] = [{ id: "all", label: "All" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.short }))];
  return (
    <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 sm:gap-8" role="tablist" aria-label="Categories">
      {items.map((c) => {
        const active = c.id === "all" ? value.length === 0 : value.includes(c.id);
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (c.id === "all") return onChange([]);
              const id = c.id;
              onChange(value.includes(id) ? value.filter((x) => x !== id) : [id]);
            }}
            className={`group flex shrink-0 flex-col items-center gap-1.5 border-b-2 pb-3 pt-1 text-xs font-semibold transition ${
              active ? "border-ink text-ink" : "border-transparent text-muted hover:border-line hover:text-ink"
            }`}
          >
            <CategoryIcon id={c.id} className={`h-6 w-6 ${active ? "" : "opacity-75 group-hover:opacity-100"}`} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
