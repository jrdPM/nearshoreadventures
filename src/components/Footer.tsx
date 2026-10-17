import Link from "next/link";
import { TOWNS } from "@/lib/towns";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-shell pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_2fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            Everything happening on Cape Cod, by land or by sea. Rounded up every few days, all year long.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Towns</h4>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink-soft sm:grid-cols-3">
            {TOWNS.map((t) => (
              <li key={t.slug}>
                <Link href={`/towns/${t.slug}`} className="hover:text-buoy hover:underline">{t.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Nearshore</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/explore" className="hover:underline">Explore events</Link></li>
            <li><Link href="/newsletter" className="hover:underline">The weekly email</Link></li>
            <li><Link href="/submit" className="hover:underline">Add your event</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Nearshore Adventures. Event details come from the organizers. Always check the original listing before you go.
        </p>
      </div>
    </footer>
  );
}
