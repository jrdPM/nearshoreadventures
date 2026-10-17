"use client";
import { Heart } from "lucide-react";
import { useSaved } from "@/lib/saved";

export function SaveButton({ id, variant = "overlay" }: { id: string; variant?: "overlay" | "pill" }) {
  const { isSaved, toggle } = useSaved();
  const on = isSaved(id);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  };
  if (variant === "pill")
    return (
      <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:bg-sand" aria-pressed={on}>
        <Heart className={`h-4 w-4 ${on ? "fill-buoy text-buoy" : ""}`} /> {on ? "Saved" : "Save"}
      </button>
    );
  return (
    <button onClick={onClick} aria-label={on ? "Remove from saved" : "Save this event"} aria-pressed={on} className="grid h-9 w-9 place-items-center rounded-full transition active:scale-90">
      <Heart className={`h-6 w-6 drop-shadow ${on ? "fill-buoy text-white" : "fill-black/30 text-white"}`} strokeWidth={2} />
    </button>
  );
}
