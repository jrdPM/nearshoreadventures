import { hasSampleData } from "@/lib/events";

export function SampleBanner() {
  if (!hasSampleData()) return null;
  return (
    <div className="bg-dune text-center text-xs font-semibold text-ink-soft">
      <p className="mx-auto max-w-7xl px-4 py-2">Preview mode: these are sample events. Real listings replace them after the first round-up.</p>
    </div>
  );
}
