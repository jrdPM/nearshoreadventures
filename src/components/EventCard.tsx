import Link from "next/link";
import type { CapeEvent } from "@/lib/types";
import { TOWN_BY_SLUG } from "@/lib/towns";
import { fmt, timeLabel } from "@/lib/dates";
import { EventPhoto } from "./EventPhoto";
import { SaveButton } from "./SaveButton";
import { Anchor } from "lucide-react";

export function EventCard({ event, priority }: { event: CapeEvent; priority?: boolean }) {
  const town = TOWN_BY_SLUG[event.venue.town];
  const multiDay = event.end && fmt(event.start, "yyyy-MM-dd") !== fmt(event.end, "yyyy-MM-dd");
  return (
    <Link href={`/events/${event.slug}`} className="group block" prefetch={priority ? true : undefined}>
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-sand">
        <EventPhoto event={event} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-lg bg-white/95 px-2.5 py-1.5 text-center leading-none shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-buoy">{fmt(event.start, "MMM")}</span>
            <span className="block text-lg font-extrabold">{fmt(event.start, "d")}</span>
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <SaveButton id={event.id} />
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {event.tags.free && <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">Free</span>}
          {event.tags.byBoat && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur">
              <Anchor className="h-3 w-3" /> By boat
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">{event.title}</h3>
        <p className="truncate text-sm text-muted">
          {event.venue.name !== town?.name ? `${event.venue.name} · ` : ""}
          {town?.name}
        </p>
        <p className="text-sm text-ink-soft">
          {multiDay
            ? `${fmt(event.start, "EEE, MMM d")} – ${fmt(event.end!, "MMM d")}`
            : `${fmt(event.start, "EEE")}${event.allDay ? " · All day" : ` · ${timeLabel(event.start)}`}`}
          {event.priceText && !event.tags.free && <span className="font-semibold text-ink"> · {event.priceText}</span>}
        </p>
      </div>
    </Link>
  );
}

export function EventGrid({ events, empty }: { events: CapeEvent[]; empty?: React.ReactNode }) {
  if (!events.length) return <>{empty}</>;
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-9 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((e, i) => (
        <EventCard key={e.id} event={e} priority={i < 4} />
      ))}
    </div>
  );
}
