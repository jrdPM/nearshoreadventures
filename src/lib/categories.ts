import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  icon: string; // key into <Icon />
  /** Stock photo used when an event has no image of its own */
  photo: string;
  /** Gradient shown while the photo loads, or if it can't load */
  gradient: string;
  keywords: string[];
}

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export const CATEGORIES: Category[] = [
  { id: "music", label: "Music & Concerts", short: "Music", icon: "music", photo: u("photo-1501386761578-eac5c94b800a"), gradient: "linear-gradient(135deg,#2b2d6e,#e8553d)", keywords: ["concert", "live music", "band", "jazz", "orchestra", "symphony", "singer", "songwriter", "acoustic", "dj", "open mic", "choir", "chorus", "bluegrass", "folk", "rock", "blues", "music"] },
  { id: "festivals", label: "Festivals & Fairs", short: "Festivals", icon: "sparkles", photo: u("photo-1533174072545-7a4b6ad7a6c3"), gradient: "linear-gradient(135deg,#f59e0b,#e8553d)", keywords: ["festival", "fest", "fair", "carnival", "parade", "celebration", "fireworks", "oysterfest", "stroll", "holly folly", "first night", "block party"] },
  { id: "food", label: "Food & Drink", short: "Food", icon: "utensils", photo: u("photo-1414235077428-338989a2e8c0"), gradient: "linear-gradient(135deg,#b45309,#f59e0b)", keywords: ["food", "dinner", "tasting", "wine", "beer", "brewery", "brew", "oyster", "clambake", "chowder", "lobster", "cooking", "chef", "brunch", "cocktail", "supper", "pancake breakfast", "bake sale"] },
  { id: "arts", label: "Art & Culture", short: "Art", icon: "palette", photo: u("photo-1460661419201-fd4cecdf8a8b"), gradient: "linear-gradient(135deg,#7c3aed,#ec4899)", keywords: ["art", "gallery", "exhibit", "exhibition", "museum", "opening reception", "painting", "sculpture", "photography", "artist", "craft", "pottery", "author", "book talk", "reading", "poetry", "lecture", "history"] },
  { id: "theater", label: "Theater & Film", short: "Theater", icon: "ticket", photo: u("photo-1503095396549-807759245b35"), gradient: "linear-gradient(135deg,#7f1d1d,#e8553d)", keywords: ["theater", "theatre", "play", "musical", "comedy", "improv", "film", "movie", "cinema", "screening", "dance", "ballet", "drag", "cabaret", "magic show", "stand-up"] },
  { id: "classes", label: "Classes & Workshops", short: "Classes", icon: "book", photo: u("photo-1452860606245-08befc0ff44b"), gradient: "linear-gradient(135deg,#0f766e,#22c55e)", keywords: ["class", "workshop", "lesson", "course", "seminar", "learn", "instruction", "tutorial", "clinic", "yoga", "tai chi", "zumba", "fitness", "painting class", "watercolor"] },
  { id: "family", label: "Kids & Family", short: "Family", icon: "smile", photo: u("photo-1503454537195-1dcabb73ffb9"), gradient: "linear-gradient(135deg,#0ea5e9,#facc15)", keywords: ["kids", "children", "family", "story time", "storytime", "toddler", "teen", "puppet", "family-friendly", "camp", "scavenger hunt", "lego", "touch tank"] },
  { id: "community", label: "Community", short: "Community", icon: "users", photo: u("photo-1511632765486-a01980e01a18"), gradient: "linear-gradient(135deg,#1e3a8a,#0ea5e9)", keywords: ["community", "town meeting", "volunteer", "fundraiser", "benefit", "library", "church", "supper", "potluck", "cleanup", "blood drive", "meeting", "forum", "club"] },
  { id: "outdoors", label: "Outdoors & Nature", short: "Outdoors", icon: "leaf", photo: u("photo-1500530855697-b586d89ba3ee"), gradient: "linear-gradient(135deg,#166534,#84cc16)", keywords: ["hike", "walk", "trail", "nature", "bird", "birding", "garden", "beach", "seal", "whale", "bike", "ride", "run", "5k", "road race", "audubon", "national seashore", "stargazing", "conservation"] },
  { id: "water", label: "On the Water", short: "Water", icon: "sailboat", photo: u("photo-1500514966906-fe245eea9344"), gradient: "linear-gradient(135deg,#0b2a3c,#0ea5e9)", keywords: ["boat", "boating", "sail", "sailing", "regatta", "harbor", "cruise", "kayak", "paddle", "paddleboard", "fishing", "marina", "waterfront", "dockside", "ferry", "whale watch", "seal cruise", "lighthouse"] },
  { id: "markets", label: "Markets & Shopping", short: "Markets", icon: "basket", photo: u("photo-1488459716781-31db52582fe9"), gradient: "linear-gradient(135deg,#65a30d,#f59e0b)", keywords: ["farmers market", "market", "flea", "craft fair", "artisan", "holiday market", "yard sale", "antique", "shopping", "pop-up", "makers"] },
  { id: "seniors", label: "Seniors", short: "Seniors", icon: "heart", photo: u("photo-1517457373958-b7bdd4587205"), gradient: "linear-gradient(135deg,#9a3412,#fb923c)", keywords: ["senior", "seniors", "council on aging", "coa", "older adults", "55+", "retiree", "medicare", "shine", "memory cafe"] },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;
