import Link from "next/link";
import { Anchor, ArrowRight, Sparkles, Smile, Ticket } from "lucide-react";
import { getEvents } from "@/lib/events";
import { applyFilters, EMPTY_FILTERS } from "@/lib/filters";
import { CATEGORIES } from "@/lib/categories";
import { REGIONS, TOWNS } from "@/lib/towns";
import type { RegionId } from "@/lib/types";
import { Row } from "@/components/Row";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SampleBanner } from "@/components/SampleBanner";

export const revalidate = 3600;

const REGION_PHOTOS: Record<RegionId, string> = {
  upper: "photo-1499002238440-d264edd596ec",
  mid: "photo-1506953823976-52e1fdc0149a",
  lower: "photo-1505228395891-9a51e7e86bf6",
  outer: "photo-1468413253725-0d5181091126",
};

export default function Home() {
  const events = getEvents();
  const weekend = applyFilters(events, { ...EMPTY_FILTERS, date: "weekend" });
  const week = applyFilters(events, { ...EMPTY_FILTERS, date: "week" });
  const boat = applyFilters(events, { ...EMPTY_FILTERS, byBoat: true });
  const free = applyFilters(events, { ...EMPTY_FILTERS, free: true, date: "month" });
  const kids = applyFilters(events, { ...EMPTY_FILTERS, kids: true });
  const justAdded = applyFilters(events, { ...EMPTY_FILTERS, sort: "newest" });

  return (
    <>
      <SampleBanner />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative mt-4 overflow-hidden rounded-[28px] md:mt-6">
          <div
            className="photo absolute inset-0"
            style={{ backgroundImage: `url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=70"), linear-gradient(135deg,#0e2233,#0f6c8c 55%,#e8553d)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/10" />
          <div className="relative px-6 pb-8 pt-28 text-white sm:px-10 md:pb-12 md:pt-40 lg:px-14">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
              <Anchor className="h-3.5 w-3.5" /> Cape Cod, all year
            </p>
            <h1 className="max-w-2xl text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              What’s happening on the Cape, by land or by sea.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
              Concerts, festivals, oyster nights, art openings, classes and town happenings from Bourne to Provincetown. We round it all up so you hear about it before, not after.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/explore?date=weekend" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-sand">
                <Sparkles className="h-4 w-4 text-buoy" /> This weekend
              </Link>
              <Link href="/explore?free=1" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25">
                <Ticket className="h-4 w-4" /> Free stuff
              </Link>
              <Link href="/explore?boat=1" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25">
                <Anchor className="h-4 w-4" /> By boat
              </Link>
              <Link href="/explore?kids=1" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25">
                <Smile className="h-4 w-4" /> With the kids
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="no-scrollbar -mx-4 mt-8 flex gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:px-0">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/explore?cat=${c.id}`} className="group flex w-32 shrink-0 flex-col gap-3 rounded-2xl border border-line p-4 transition hover:border-ink hover:shadow-float lg:w-auto">
              <CategoryIcon id={c.id} className="h-7 w-7 text-buoy" />
              <span className="text-sm font-bold leading-tight">{c.label}</span>
            </Link>
          ))}
        </section>

        <Row title="This weekend" subtitle="Friday night through Sunday" href="/explore?date=weekend" events={weekend} />
        <Row title="Coming up this week" href="/explore?date=week" events={week} />
        <Row title="Reachable by boat" subtitle="Tie up and walk over" href="/explore?boat=1" events={boat} />
        <Row title="Free this month" href="/explore?free=1&date=month" events={free} />
        <Row title="With the kids" href="/explore?kids=1" events={kids} />

        {/* Regions */}
        <section className="mt-14">
          <h2 className="mb-4 text-[22px] font-extrabold tracking-tight">Explore by part of the Cape</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(Object.keys(REGIONS) as RegionId[]).map((r) => {
              const n = events.filter((e) => TOWNS.find((t) => t.slug === e.venue.town)?.region === r).length;
              return (
                <Link key={r} href={`/explore?region=${r}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[4/3]">
                  <div
                    className="photo absolute inset-0 transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url("https://images.unsplash.com/${REGION_PHOTOS[r]}?auto=format&fit=crop&w=800&q=70"), linear-gradient(160deg,#0f6c8c,#0e2233)` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-lg font-extrabold">{REGIONS[r].name}</p>
                    <p className="text-xs text-white/80">{REGIONS[r].blurb}</p>
                    <p className="mt-1 text-xs font-bold text-seaglass">{n} upcoming</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <Row title="Just added" subtitle="Fresh from our latest round-up" href="/explore?sort=newest" events={justAdded} />

        {/* Newsletter */}
        <section className="mt-16 overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-white sm:px-10 md:flex md:items-center md:justify-between md:gap-10 lg:px-14">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-buoy">The Thursday email</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Your weekend on the Cape, in your inbox.</h2>
            <p className="mt-3 text-white/75">The best of what’s coming up, every Thursday morning. No fluff, just the good stuff.</p>
          </div>
          <div className="mt-8 md:mt-0">
            <NewsletterForm dark />
          </div>
        </section>

        <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[28px] bg-sand px-6 py-8 sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="text-xl font-extrabold">Running something on the Cape?</h2>
            <p className="text-sm text-muted">Venues, libraries, senior centers and organizers can add events for free.</p>
          </div>
          <Link href="/submit" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-ink-soft">
            Add your event <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
