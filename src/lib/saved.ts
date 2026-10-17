"use client";
import { useCallback, useSyncExternalStore } from "react";

// Hearted events are saved on this device only (no accounts).
const KEY = "na:saved";
const listeners = new Set<() => void>();
let snapshot: string[] = [];
let loaded = false;

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && ((snapshot = read()), cb());
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: string[] = [];
function getSnapshot() {
  if (!loaded) {
    snapshot = read();
    loaded = true;
  }
  return snapshot;
}

export function useSaved() {
  const saved = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const cur = getSnapshot();
    snapshot = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot));
    } catch {
      /* private mode: keep it in memory */
    }
    listeners.forEach((l) => l());
  }, []);
  return { saved, isSaved: (id: string) => saved.includes(id), toggle };
}
