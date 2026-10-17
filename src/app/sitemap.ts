import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/events";
import { TOWNS } from "@/lib/towns";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nearshoreadventures.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/newsletter`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/submit`, changeFrequency: "monthly", priority: 0.5 },
    ...TOWNS.map((t) => ({ url: `${SITE}/towns/${t.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...getEvents()
      .filter((e) => !e.sample)
      .map((e) => ({ url: `${SITE}/events/${e.slug}`, lastModified: new Date(e.lastSeen), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
