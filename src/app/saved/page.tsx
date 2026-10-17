import type { Metadata } from "next";
import { getEvents } from "@/lib/events";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = { title: "Saved events", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Saved</h1>
      <p className="mt-1 mb-8 text-sm text-muted">Tap the heart on any event to keep it here. Saved on this device, no account needed.</p>
      <SavedList events={getEvents()} />
    </div>
  );
}
