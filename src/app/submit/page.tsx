import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Add your event",
  description: "Venues, libraries, senior centers and organizers: list your Cape Cod event for free.",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-buoy">Free listing</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Add your event</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Running a concert, class, fundraiser, market or anything else open to the public on the Cape? Tell us about it. We give every submission a quick
          look, then it goes on the calendar and might make the Thursday email.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-ink-soft">
          <li>✔︎ It’s free, always</li>
          <li>✔︎ Shows up in search, the calendar and the map</li>
          <li>✔︎ Got a lot of events? Send us your calendar link and we’ll pull them in automatically</li>
        </ul>
      </div>
      <SubmitForm />
    </div>
  );
}
