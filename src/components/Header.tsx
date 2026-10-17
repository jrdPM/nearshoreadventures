"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Mail, Plus } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

export function Header() {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");
  const onExplore = path.startsWith("/explore");

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 md:h-20 lg:px-8">
        <Link href="/" aria-label="Nearshore Adventures home" className="shrink-0">
          <Logo />
        </Link>

        {!onExplore && (
          <form
            className="mx-auto hidden w-full max-w-md md:block"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/explore${q ? `?q=${encodeURIComponent(q)}` : ""}`);
            }}
          >
            <label className="flex items-center gap-3 rounded-full border border-line bg-white py-2 pl-5 pr-2 shadow-float transition hover:shadow-pop">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Concerts, oysters, story time…"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted"
                aria-label="Search events"
              />
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-buoy text-white">
                <Search className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </label>
          </form>
        )}

        <nav className="ml-auto hidden items-center gap-1 text-sm font-semibold md:flex">
          <Link href="/explore" className="rounded-full px-4 py-2.5 hover:bg-sand">Explore</Link>
          <Link href="/explore?view=calendar" className="rounded-full px-4 py-2.5 hover:bg-sand">Calendar</Link>
          <Link href="/explore?view=map" className="rounded-full px-4 py-2.5 hover:bg-sand">Map</Link>
          <Link href="/submit" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 hover:bg-sand">
            <Plus className="h-4 w-4" /> Add an event
          </Link>
          <Link href="/newsletter" className="ml-1 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-white hover:bg-ink-soft">
            <Mail className="h-4 w-4" /> Weekly email
          </Link>
        </nav>

        <Link href="/explore" className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-line md:hidden" aria-label="Search events">
          <Search className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </header>
  );
}
