"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, CalendarDays, Map, Heart, Mail } from "lucide-react";
import { Suspense } from "react";

function Nav() {
  const path = usePathname();
  const params = useSearchParams();
  const view = params.get("view");
  const items = [
    { href: "/explore", label: "Explore", icon: Compass, active: path === "/explore" && (!view || view === "list") },
    { href: "/explore?view=calendar", label: "Calendar", icon: CalendarDays, active: path === "/explore" && view === "calendar" },
    { href: "/explore?view=map", label: "Map", icon: Map, active: path === "/explore" && view === "map" },
    { href: "/saved", label: "Saved", icon: Heart, active: path === "/saved" },
    { href: "/newsletter", label: "Email", icon: Mail, active: path === "/newsletter" },
  ];
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl md:hidden" aria-label="Main">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, icon: I, active }) => (
          <li key={label}>
            <Link href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-buoy" : "text-muted"}`}>
              <I className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <Nav />
    </Suspense>
  );
}
