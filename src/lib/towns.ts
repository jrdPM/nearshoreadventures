import type { RegionId } from "./types";

export interface Town {
  slug: string;
  name: string;
  region: RegionId;
  lat: number;
  lng: number;
  villages: string[];
  blurb: string;
}

export const REGIONS: Record<RegionId, { name: string; blurb: string }> = {
  upper: { name: "Upper Cape", blurb: "Bourne, Sandwich, Falmouth and Mashpee" },
  mid: { name: "Mid Cape", blurb: "Barnstable, Yarmouth and Dennis" },
  lower: { name: "Lower Cape", blurb: "Harwich, Brewster, Chatham and Orleans" },
  outer: { name: "Outer Cape", blurb: "Eastham, Wellfleet, Truro and Provincetown" },
};

export const TOWNS: Town[] = [
  { slug: "bourne", name: "Bourne", region: "upper", lat: 41.7412, lng: -70.5989, villages: ["Buzzards Bay", "Pocasset", "Cataumet", "Monument Beach", "Sagamore", "Sagamore Beach", "Bournedale"], blurb: "Gateway to the Cape, right on the Canal." },
  { slug: "sandwich", name: "Sandwich", region: "upper", lat: 41.7590, lng: -70.4939, villages: ["East Sandwich", "Forestdale"], blurb: "The Cape's oldest town, with a boardwalk and a lot of history." },
  { slug: "falmouth", name: "Falmouth", region: "upper", lat: 41.5515, lng: -70.6148, villages: ["Woods Hole", "North Falmouth", "West Falmouth", "East Falmouth", "Waquoit", "Teaticket", "Hatchville", "Falmouth Heights"], blurb: "Main Street, Woods Hole science and eight villages of beaches." },
  { slug: "mashpee", name: "Mashpee", region: "upper", lat: 41.6484, lng: -70.4811, villages: ["New Seabury", "Popponesset", "Mashpee Commons"], blurb: "Home of the Mashpee Wampanoag and Mashpee Commons." },
  { slug: "barnstable", name: "Barnstable", region: "mid", lat: 41.6532, lng: -70.2881, villages: ["Hyannis", "Hyannis Port", "Centerville", "Osterville", "Cotuit", "Marstons Mills", "West Barnstable", "Barnstable Village", "Craigville"], blurb: "Hyannis harbor, Main Street and seven villages." },
  { slug: "yarmouth", name: "Yarmouth", region: "mid", lat: 41.7057, lng: -70.2286, villages: ["South Yarmouth", "West Yarmouth", "Yarmouth Port", "Bass River"], blurb: "Route 28 fun on one side, quiet Old King's Highway on the other." },
  { slug: "dennis", name: "Dennis", region: "mid", lat: 41.7354, lng: -70.1939, villages: ["Dennis Port", "East Dennis", "West Dennis", "South Dennis", "Dennis Village"], blurb: "The Cape Playhouse, Cape Cinema and great bay beaches." },
  { slug: "harwich", name: "Harwich", region: "lower", lat: 41.6862, lng: -70.0761, villages: ["Harwich Port", "West Harwich", "East Harwich", "North Harwich", "Harwich Center"], blurb: "Cranberry country and Saquatucket Harbor." },
  { slug: "brewster", name: "Brewster", region: "lower", lat: 41.7601, lng: -70.0828, villages: ["East Brewster", "West Brewster"], blurb: "Tidal flats, Nickerson State Park and the Brewster Store." },
  { slug: "chatham", name: "Chatham", region: "lower", lat: 41.6821, lng: -69.9597, villages: ["North Chatham", "South Chatham", "West Chatham", "Chatham Port"], blurb: "Friday band concerts, the fish pier and the seals." },
  { slug: "orleans", name: "Orleans", region: "lower", lat: 41.7898, lng: -69.9900, villages: ["East Orleans", "South Orleans", "Rock Harbor"], blurb: "Rock Harbor sunsets and Nauset Beach." },
  { slug: "eastham", name: "Eastham", region: "outer", lat: 41.8301, lng: -69.9739, villages: ["North Eastham"], blurb: "Front door to the National Seashore." },
  { slug: "wellfleet", name: "Wellfleet", region: "outer", lat: 41.9371, lng: -70.0328, villages: ["South Wellfleet"], blurb: "Oysters, galleries and the drive-in." },
  { slug: "truro", name: "Truro", region: "outer", lat: 41.9932, lng: -70.0497, villages: ["North Truro"], blurb: "Dunes, lighthouses and a whole lot of quiet." },
  { slug: "provincetown", name: "Provincetown", region: "outer", lat: 42.0523, lng: -70.1860, villages: ["P-town", "Ptown", "Provincetown Center"], blurb: "Commercial Street, art colonies and the end of the road." },
];

export const TOWN_BY_SLUG = Object.fromEntries(TOWNS.map((t) => [t.slug, t]));

/** Find a Cape town in free text (an address, a venue line, etc). */
export function matchTown(text: string | undefined | null): Town | undefined {
  if (!text) return undefined;
  const hay = ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ")} `;
  // Villages first so "Hyannis" maps to Barnstable before "Barnstable" matches anything else.
  for (const t of TOWNS) {
    for (const v of t.villages) {
      if (hay.includes(` ${v.toLowerCase().replace(/[^a-z0-9\s-]/g, " ")} `)) return t;
    }
  }
  for (const t of TOWNS) {
    if (hay.includes(` ${t.name.toLowerCase()} `)) return t;
  }
  return undefined;
}
