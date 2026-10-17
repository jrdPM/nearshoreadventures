export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  // A buoy-orange tile with a rising sun over two waves: by land or by sea.
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#E8553D" />
      <circle cx="20" cy="18" r="6.5" fill="#FFF4E8" />
      <path d="M4 25q4-3.4 8 0t8 0t8 0t8 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M4 31q4-3.4 8 0t8 0t8 0t8 0" stroke="#0E2233" strokeOpacity=".35" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[17px] font-extrabold tracking-tight text-ink">nearshore</span>
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.22em] text-buoy">adventures</span>
        </span>
      )}
    </span>
  );
}
