import { Suspense } from "react";
import type { Metadata } from "next";
import { getEvents } from "@/lib/events";
import { Explorer } from "@/components/Explorer";
import { SampleBanner } from "@/components/SampleBanner";


export const metadata: Metadata = {
  title: "Explore Cape Cod events",
  description: "Search and filter every concert, festival, class and community event on Cape Cod. List, calendar and map views.",
};

export default function ExplorePage() {
  const events = getEvents();
  return (
    <>
      <SampleBanner />
      <Suspense>
        <Explorer events={events} />
      </Suspense>
    </>
  );
}
