import { NextResponse } from "next/server";
import { normalize } from "../../../../scripts/scrape/normalize";
import { commitJson, githubConfigured } from "@/lib/github";
import { TOWN_BY_SLUG } from "@/lib/towns";
import type { CategoryId, ReviewItem, Source } from "@/lib/types";

interface Body {
  title?: string;
  date?: string;
  time?: string;
  endTime?: string;
  town?: string;
  venue?: string;
  address?: string;
  description?: string;
  url?: string;
  price?: string;
  category?: CategoryId;
  name?: string;
  org?: string;
  website?: string; // honeypot: real people never fill this in
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body;
  if (b.website) return NextResponse.json({ message: "Thanks!" }); // quietly drop bots

  const missing = ["title", "date", "town", "venue"].filter((k) => !b[k as keyof Body]?.toString().trim());
  if (missing.length) return NextResponse.json({ error: `Please fill in: ${missing.join(", ")}` }, { status: 400 });
  if (!TOWN_BY_SLUG[b.town!]) return NextResponse.json({ error: "Pick a Cape town." }, { status: 400 });
  if ((b.description ?? "").length > 2000) return NextResponse.json({ error: "Description is a bit long. Keep it under 2,000 characters." }, { status: 400 });

  const source: Source = {
    id: "submission",
    name: b.org?.trim() || "Community submission",
    url: b.url?.trim() || "https://nearshoreadventures.com/submit",
    type: "auto",
    trusted: true,
    enabled: true,
  };
  const n = normalize(
    {
      title: b.title!.slice(0, 140),
      start: b.time ? `${b.date}T${b.time}` : b.date!,
      end: b.time && b.endTime ? `${b.date}T${b.endTime}` : undefined,
      allDay: !b.time,
      description: b.description,
      url: b.url || undefined,
      venueName: b.venue,
      address: b.address,
      city: TOWN_BY_SLUG[b.town!].name,
      price: b.price || undefined,
      categories: b.category ? [b.category] : undefined,
    },
    source,
    new Date().toISOString(),
  );
  if (!n) return NextResponse.json({ error: "That date looks like it's already passed." }, { status: 400 });

  if (!githubConfigured()) {
    return NextResponse.json({ error: "Submissions open very soon. Please check back in a few days." }, { status: 503 });
  }

  const item: ReviewItem = {
    event: n.event,
    kind: "submitted",
    reasons: [`Submitted by ${b.name || "someone"}${b.org ? ` (${b.org})` : ""}`],
    // No email address: data/ lives in the repo, so we keep personal details out of it.
    submittedBy: { name: b.name, org: b.org },
    queuedAt: new Date().toISOString(),
  };
  await commitJson(
    ["data/review-queue.json"],
    (cur) => {
      const q = (cur["data/review-queue.json"] as ReviewItem[]).filter((x) => x.event.id !== item.event.id);
      return { "data/review-queue.json": [...q, item] };
    },
    `Event submitted: ${item.event.title}`,
  );
  return NextResponse.json({ message: "Thanks! We'll take a quick look and it should be live within a day or two." });
}
