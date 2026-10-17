export type CategoryId =
  | "music"
  | "festivals"
  | "food"
  | "arts"
  | "theater"
  | "classes"
  | "family"
  | "community"
  | "outdoors"
  | "water"
  | "markets"
  | "seniors";

export type RegionId = "upper" | "mid" | "lower" | "outer";

export interface Venue {
  name: string;
  address?: string;
  town: string; // town slug, e.g. "falmouth"
  lat?: number;
  lng?: number;
}

export interface EventTags {
  free: boolean;
  kids: boolean;
  seniors: boolean;
  outdoor: boolean;
  byBoat: boolean;
}

export interface CapeEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  /** ISO 8601 with offset, e.g. 2026-10-24T19:00:00-04:00 */
  start: string;
  end?: string;
  allDay: boolean;
  venue: Venue;
  categories: CategoryId[];
  tags: EventTags;
  priceText?: string;
  url: string;
  ticketUrl?: string;
  image?: string;
  source: { id: string; name: string; url: string };
  /** true when it came from a trusted source or was approved by a human */
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
  sample?: boolean;
}

export interface ReviewItem {
  event: CapeEvent;
  reasons: string[];
  kind: "scraped" | "submitted";
  submittedBy?: { name?: string; org?: string };
  queuedAt: string;
}

export type SourceType = "auto" | "tribe" | "ics" | "jsonld" | "ai";

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  /** Optional explicit feed URL (ICS, Tribe API) when it differs from url */
  feed?: string;
  town?: string;
  categories?: CategoryId[];
  trusted: boolean;
  enabled: boolean;
  notes?: string;
}
