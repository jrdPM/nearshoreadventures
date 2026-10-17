import type { CategoryId } from "../../src/lib/types";

/** What an adapter hands back before we clean it up. Everything optional except title/start. */
export interface RawEvent {
  title: string;
  start: string; // ISO, or "yyyy-MM-dd" for all-day
  end?: string;
  allDay?: boolean;
  description?: string;
  url?: string;
  ticketUrl?: string;
  image?: string;
  venueName?: string;
  address?: string;
  city?: string;
  /** State or country when the source says, so "Falmouth, UK" isn't mistaken for ours */
  region?: string;
  lat?: number;
  lng?: number;
  price?: string;
  free?: boolean;
  categories?: CategoryId[];
  /** 0..1, only set by the AI adapter */
  confidence?: number;
}
