import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl">🌊</p>
      <h1 className="mt-4 text-3xl font-extrabold">This one drifted off</h1>
      <p className="mt-2 text-muted">The event may have already happened, or the link changed.</p>
      <Link href="/explore" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">See what’s coming up</Link>
    </div>
  );
}
