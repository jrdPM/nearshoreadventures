import type { Metadata } from "next";
import Link from "next/link";
import { getEvents } from "@/lib/events";
import { buildDigest } from "@/lib/newsletter";
import { NewsletterForm } from "@/components/NewsletterForm";
import { EventCard } from "@/components/EventCard";
import { TOWN_BY_SLUG } from "@/lib/towns";
import { timeLabel } from "@/lib/dates";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "The Thursday email",
  description: "The best of what's happening on Cape Cod, in your inbox every Thursday morning.",
};

export default function NewsletterPage() {
  const d = buildDigest(getEvents());
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <section className="py-14 text-center md:py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-buoy">Every Thursday morning</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">Your weekend on the Cape, sorted.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          One friendly email with the best concerts, festivals, food nights and local happenings coming up. Free, and you can leave anytime.
        </p>
        <div className="mt-8 flex justify-center">
          <NewsletterForm />
        </div>
      </section>

      <section className="rounded-[28px] bg-sand p-6 md:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">This week’s issue · {d.weekOf}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{d.subject}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {d.picks.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
        {d.days.length > 0 && (
          <div className="mt-10 space-y-6">
            {d.days.map((day) => (
              <div key={day.label}>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-buoy">{day.label}</h3>
                <ul className="mt-2 divide-y divide-line">
                  {day.events.map((e) => (
                    <li key={e.id} className="py-2.5">
                      <Link href={`/events/${e.slug}`} className="font-bold hover:underline">{e.title}</Link>
                      <p className="text-sm text-muted">
                        {e.allDay ? "All day" : timeLabel(e.start)} · {e.venue.name}, {TOWN_BY_SLUG[e.venue.town]?.name}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
