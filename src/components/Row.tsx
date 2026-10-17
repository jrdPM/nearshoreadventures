import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CapeEvent } from "@/lib/types";
import { EventCard } from "./EventCard";

export function Row({ title, subtitle, href, events }: { title: string; subtitle?: string; href: string; events: CapeEvent[] }) {
  if (!events.length) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-bold underline-offset-4 hover:underline">
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 sm:scroll-px-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {events.slice(0, 8).map((e, i) => (
          <div key={e.id} className={`w-[78%] shrink-0 snap-start min-[480px]:w-[46%] md:w-[31%] lg:w-auto ${i >= 4 ? "lg:hidden" : ""}`}>
            <EventCard event={e} />
          </div>
        ))}
      </div>
    </section>
  );
}
