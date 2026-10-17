"use client";
import Link from "next/link";
import type { CapeEvent } from "@/lib/types";
import { useSaved } from "@/lib/saved";
import { EventGrid } from "./EventCard";

export function SavedList({ events }: { events: CapeEvent[] }) {
  const { saved } = useSaved();
  const list = events.filter((e) => saved.includes(e.id));
  return (
    <EventGrid
      events={list}
      empty={
        <div className="rounded-3xl bg-sand px-6 py-16 text-center">
          <p className="text-lg font-bold">No saved events yet</p>
          <p className="mt-1 text-sm text-muted">When something catches your eye, tap the heart.</p>
          <Link href="/explore" className="mt-5 inline-block rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">Start exploring</Link>
        </div>
      }
    />
  );
}
