import { Music, Sparkles, UtensilsCrossed, Palette, Ticket, BookOpen, Smile, Users, Leaf, Sailboat, ShoppingBasket, HeartHandshake, Compass, type LucideProps } from "lucide-react";
import type { CategoryId } from "@/lib/types";

const MAP: Record<CategoryId | "all", React.ComponentType<LucideProps>> = {
  all: Compass,
  music: Music,
  festivals: Sparkles,
  food: UtensilsCrossed,
  arts: Palette,
  theater: Ticket,
  classes: BookOpen,
  family: Smile,
  community: Users,
  outdoors: Leaf,
  water: Sailboat,
  markets: ShoppingBasket,
  seniors: HeartHandshake,
};

export function CategoryIcon({ id, ...props }: { id: CategoryId | "all" } & LucideProps) {
  const C = MAP[id];
  return <C strokeWidth={1.75} {...props} />;
}
