import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "Why Nearshore Adventures exists and how we find Cape Cod events." };

export default function About() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-buoy">About</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Hear about it before, not after.</h1>
      <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-ink-soft">
        <p>
          Nearshore Adventures started years ago as a little blog about things you could get to by boat around Boston Harbor. The idea was simple: there’s
          so much going on, and too often you find out the day after.
        </p>
        <p>
          Now it covers all of Cape Cod, by land or by sea, all year long. Concerts and festivals, sure, but also the art opening down the street, the
          watercolor class at the community center, the chowder cook-off and the Tuesday tai chi at the senior center.
        </p>
        <h2 className="pt-4 text-2xl font-extrabold text-ink">How we find events</h2>
        <p>
          Every few days we check the public calendars of chambers of commerce, town halls, libraries, councils on aging, museums, theaters and venues
          across the Cape. We pull the basics (what, when, where) and always link back to the organizer for the full details. Listings from sources we
          haven’t worked with before get a human look before they go live.
        </p>
        <p>
          If you run one of those calendars and want us to use a feed, or to stop checking your site, just let us know. Our bot identifies itself as
          NearshoreAdventuresBot and follows robots.txt.
        </p>
        <h2 className="pt-4 text-2xl font-extrabold text-ink">Got an event?</h2>
        <p>
          <Link href="/submit" className="font-bold text-buoy underline">Add it here</Link>. It’s free.
        </p>
      </div>
    </article>
  );
}
