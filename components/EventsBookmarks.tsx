"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DC_SAVED_EVENTS_KEY } from "@/lib/dc-storage";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(DC_SAVED_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(DC_SAVED_EVENTS_KEY, JSON.stringify(ids));
}

type Ctx = { saved: Set<string>; toggle: (id: string) => void };

const EventsBookmarkContext = createContext<Ctx | null>(null);

export function useEventBookmark() {
  const v = useContext(EventsBookmarkContext);
  if (!v) throw new Error("useEventBookmark outside provider");
  return v;
}

export function EventsBookmarks({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const sync = useCallback(() => setSaved(new Set(readIds())), []);

  useEffect(() => {
    sync();
  }, [sync]);

  const toggle = useCallback((id: string) => {
    const ids = readIds();
    const i = ids.indexOf(id);
    if (i === -1) ids.push(id);
    else ids.splice(i, 1);
    writeIds(ids);
    setSaved(new Set(ids));
  }, []);

  return (
    <EventsBookmarkContext.Provider value={{ saved, toggle }}>{children}</EventsBookmarkContext.Provider>
  );
}

export function EventBookmarkButton({ eventId }: { eventId: string }) {
  const { saved, toggle } = useEventBookmark();
  const isSaved = saved.has(eventId);

  return (
    <button
      type="button"
      className={`bookmark ${isSaved ? "bookmark--solid" : "bookmark--outline"}`}
      data-event-id={eventId}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from saved events" : "Save event to dashboard"}
      title={isSaved ? "Remove from saved" : "Save event"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(eventId);
      }}
    >
      <svg viewBox="0 0 16 20" fill="none" aria-hidden>
        <path d="M3 2H13V18L8 14.7L3 18V2Z" />
      </svg>
    </button>
  );
}
