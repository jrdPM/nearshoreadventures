"use client";
import { Share } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={share} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:bg-sand">
      <Share className="h-4 w-4" /> {copied ? "Link copied" : "Share"}
    </button>
  );
}
