import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, ChevronLeft, Clock, MapPin, Tag, Anchor, Info } from "lucide-react";
import { getEvent, getEvents } from "@/lib/events";
import { CATEGORY_BY_ID } from "@/lib/categories";
import { TOWN_BY_SLUG, REGIONS } from "@/lib/towns";
import { fmt, whenLabel } from "@/lib/dates";
import { EventPhoto } from "@/components/EventPhoto";
import { AddToCalendar } from "@/components/AddToCalendar";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { MiniMapLazy } from "@/components/MiniMapLazy";
import { Row } from "@/components/Row";
import { CategoryIcon } from "@/components/CategoryIcon";


export const dynamicParams = false;

export function generateStaticParams() {
  return getEvents().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getEvent((await params).slug);
  if (!e) return {};
  const town = TOWN_BY_SLUG[e.venue.town]?.name;
  return {
    title: `${e.title} in ${town}, ${fmt(e.start, "MMM d")}`,
    description: e.summary || `${e.title} at ${e.venue.name}, ${town}. ${whenLabel(e)}.`,
    openGraph: { images: e.image ? [e.image] : [CATEGORY_BY_ID[e.categories[0]].photo] },
    alternates: { canonical: `/events/${e.slug}` },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = getEvent((await params).slug);
  if (!e) notFound();
  const town = TOWN_BY_SLUG[e.venue.town];
  const all = getEvents().filter((x) => x.id !== e.id);
  const sameTown = all.filter((x) => x.venue.town === e.venue.town);
  const similar = all.filter((x) => x.categories[0] === e.categories[0] && x.venue.town !== e.venue.town);

  // Structured data so Google can show this event in search.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.start,
    endDate: e.end,
    description: e.summary,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue.name,
      address: { "@type": "PostalAddress", streetAddress: e.venue.address, addressLocality: town?.name, addressRegion: "MA", addressCountry: "US" },
    },
    image: e.image ? [e.image] : undefined,
    isAccessibleForFree: e.tags.free,
    url: e.url,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="flex items-center justify-between py-4">
        <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4" /> All events
        </Link>
        <div className="flex gap-2">
          <ShareButton title={e.title} />
          <SaveButton id={e.id} variant="pill" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px]">
        <EventPhoto event={e} className="aspect-[16/10] w-full md:aspect-[21/9]" />
        {e.sample && <span className="absolute left-4 top-4 rounded-full bg-dune px-3 py-1 text-xs font-bold">Sample event</span>}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex flex-wrap gap-2">
            {e.categories.map((c) => (
              <Link key={c} href={`/explore?cat=${c}`} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs font-bold hover:bg-dune">
                <CategoryIcon id={c} className="h-3.5 w-3.5" /> {CATEGORY_BY_ID[c].label}
              </Link>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-[40px]">{e.title}</h1>
          <p className="mt-2 text-lg text-ink-soft">
            {e.venue.name} · {town?.name}
          </p>

          <div className="mt-8 divide-y divide-line border-y border-line">
            <div className="flex gap-4 py-5">
              <Clock className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} />
              <div>
                <p className="font-bold">{whenLabel(e)}</p>
                <p className="text-sm text-muted">{fmt(e.start, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex gap-4 py-5">
              <MapPin className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} />
              <div>
                <p className="font-bold">{e.venue.name}</p>
                <p className="text-sm text-muted">{e.venue.address || `${town?.name}, ${town ? REGIONS[town.region].name : "Cape Cod"}`}</p>
              </div>
            </div>
            {e.priceText && (
              <div className="flex gap-4 py-5">
                <Tag className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} />
                <p className="font-bold">{e.priceText}</p>
              </div>
            )}
            {e.tags.byBoat && (
              <div className="flex gap-4 py-5">
                <Anchor className="mt-0.5 h-6 w-6 shrink-0 text-sea" strokeWidth={1.6} />
                <div>
                  <p className="font-bold">Reachable by boat</p>
                  <p className="text-sm text-muted">This one’s on or near the water. Check with the harbormaster for dock or mooring space.</p>
                </div>
              </div>
            )}
          </div>

          {e.summary && (
            <section className="mt-8">
              <h2 className="mb-2 text-xl font-extrabold">About this event</h2>
              <p className="text-[17px] leading-relaxed text-ink-soft">{e.summary}</p>
            </section>
          )}

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            {e.tags.free && <span className="rounded-full bg-seaglass px-3 py-1.5">Free</span>}
            {e.tags.kids && <span className="rounded-full bg-seaglass px-3 py-1.5">Kid-friendly</span>}
            {e.tags.seniors && <span className="rounded-full bg-seaglass px-3 py-1.5">Great for seniors</span>}
            {e.tags.outdoor && <span className="rounded-full bg-seaglass px-3 py-1.5">Outdoors</span>}
          </div>

          {e.venue.lat && e.venue.lng && (
            <section className="mt-10">
              <h2 className="mb-3 text-xl font-extrabold">Where it is</h2>
              <MiniMapLazy lat={e.venue.lat} lng={e.venue.lng} label={e.venue.name} />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue.name}, ${e.venue.address ?? ""} ${town?.name}, MA`)}`}
                target="_blank"
                rel="noopener"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline"
              >
                Get directions <ArrowUpRight className="h-4 w-4" />
              </a>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-line p-6 shadow-float">
            <p className="text-2xl font-extrabold">{fmt(e.start, "EEE, MMM d")}</p>
            <p className="text-muted">{whenLabel(e).split(" · ").slice(1).join(" · ") || "See listing for times"}</p>
            <div className="mt-5 space-y-3">
              <AddToCalendar event={e} />
              {e.ticketUrl && (
                <a href={e.ticketUrl} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-[15px] font-bold text-white hover:bg-ink-soft">
                  Get tickets <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              <a href={e.url} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-xl border border-ink px-5 py-3.5 text-[15px] font-bold hover:bg-sand">
                See the original listing <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-5 flex gap-2 text-xs text-muted">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                Listed by{" "}
                <a href={e.source.url} className="font-semibold underline" target="_blank" rel="noopener">
                  {e.source.name}
                </a>
                . Details can change, so check before you head out.
              </span>
            </p>
          </div>
        </aside>
      </div>

      {/* Phones: keep the main action in reach, Airbnb-style */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold">{fmt(e.start, "EEE, MMM d")}</p>
            <p className="truncate text-xs text-muted">{e.priceText ?? whenLabel(e).split(" · ").slice(1).join(" · ")}</p>
          </div>
          <div className="w-48">
            <AddToCalendar event={e} up compact />
          </div>
        </div>
      </div>

      <Row title={`More in ${town?.name}`} href={`/towns/${e.venue.town}`} events={sameTown} />
      <Row title={`More ${CATEGORY_BY_ID[e.categories[0]].label.toLowerCase()}`} href={`/explore?cat=${e.categories[0]}`} events={similar} />
    </div>
  );
}
