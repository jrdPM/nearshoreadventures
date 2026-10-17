"use client";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CapeEvent } from "@/lib/types";
import { eventToIcs, googleCalendarUrl, outlookCalendarUrl } from "@/lib/ics";

export function AddToCalendar({ event, up = false, compact = false }: { event: CapeEvent; up?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const downloadIcs = () => {
    const blob = new Blob([eventToIcs(event)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${event.slug}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-buoy px-5 py-3.5 text-[15px] font-bold text-white transition hover:bg-buoy-dark" aria-expanded={open}>
        <CalendarPlus className="h-5 w-5" /> {compact ? "Add to calendar" : "Add to my calendar"} <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className={`absolute inset-x-0 z-20 ${up ? "bottom-full mb-2" : "top-full mt-2"} overflow-hidden rounded-xl border border-line bg-white text-sm font-semibold shadow-pop`}>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener" className="block px-4 py-3 hover:bg-sand">Google Calendar</a>
          <button onClick={downloadIcs} className="block w-full px-4 py-3 text-left hover:bg-sand">Apple Calendar (.ics)</button>
          <a href={outlookCalendarUrl(event)} target="_blank" rel="noopener" className="block px-4 py-3 hover:bg-sand">Outlook</a>
          <button onClick={downloadIcs} className="block w-full px-4 py-3 text-left hover:bg-sand">Other (.ics file)</button>
        </div>
      )}
    </div>
  );
}
