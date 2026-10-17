import { CATEGORY_BY_ID } from "@/lib/categories";
import type { CapeEvent } from "@/lib/types";

/** Event's own image if it has one, otherwise a stock photo for its main category. Gradient underneath as a fallback. */
export function EventPhoto({ event, className = "" }: { event: CapeEvent; className?: string }) {
  const cat = CATEGORY_BY_ID[event.categories[0]] ?? CATEGORY_BY_ID.community;
  const img = event.image || cat.photo;
  return (
    <div
      className={`photo ${className}`}
      style={{ backgroundImage: `url("${img}"), ${cat.gradient}` }}
      role="img"
      aria-label={event.title}
    />
  );
}
