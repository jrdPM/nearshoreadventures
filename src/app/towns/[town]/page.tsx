import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getEvents } from "@/lib/events";
import { TOWNS, TOWN_BY_SLUG, REGIONS } from "@/lib/towns";
import { EventGrid } from "@/components/EventCard";
import { SampleBanner } from "@/components/SampleBanner";

export const revalidate = 3600;

export function generateStaticParams() {
  return TOWNS.map((t) => ({ town: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const t = TOWN_BY_SLUG[(await params).town];
  if (!t) return {};
  return {
    title: `Things to do in ${t.name}, MA`,
    description: `Upcoming events in ${t.name} on Cape Cod: concerts, festivals, food, art, classes and community happenings. ${t.blurb}`,
  };
}

export default async function TownPage({ params }: { params: Promise<{ town: string }> }) {
  const t = TOWN_BY_SLUG[(await params).town];
  if (!t) notFound();
  const events = getEvents().filter((e) => e.venue.town === t.slug);
  const neighbors = TOWNS.filter((x) => x.region === t.region && x.slug !== t.slug);
  return (
    <>
      <SampleBanner />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="py-10 md:py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-buoy">{REGIONS[t.region].name}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Things to do in {t.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{t.blurb}</p>
          {t.villages.length > 0 && <p className="mt-2 text-sm text-muted">Including {t.villages.filter((v) => !/^p-?town$/i.test(v)).join(", ")}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/explore?town=${t.slug}&view=calendar`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              {t.name} calendar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={`/explore?town=${t.slug}&view=map`} className="rounded-full border border-line px-5 py-3 text-sm font-bold hover:border-ink">
              See it on the map
            </Link>
          </div>
        </header>
        <EventGrid
          events={events}
          empty={<p className="rounded-3xl bg-sand px-6 py-14 text-center text-muted">Nothing listed in {t.name} right now. Check back after our next round-up.</p>}
        />
        <section className="mt-14">
          <h2 className="mb-3 text-lg font-extrabold">Nearby towns</h2>
          <div className="flex flex-wrap gap-2">
            {neighbors.map((n) => (
              <Link key={n.slug} href={`/towns/${n.slug}`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink">
                {n.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
