"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DC_SAVED_EVENTS_KEY } from "@/lib/dc-storage";

const CATALOG: Record<
  string,
  { month: string; day: string; year: string; title: string; meta: string }
> = {
  evt1: {
    month: "MAR",
    day: "15",
    year: "2026",
    title: "Event Name",
    meta: "Event Time Start and End<br />Event Venue<br />Event Organizer",
  },
  evt2: {
    month: "MAR",
    day: "20",
    year: "2026",
    title: "Event Name",
    meta: "Event Time Start and End<br />Event Venue<br />Event Organizer",
  },
  evt3: {
    month: "APR",
    day: "02",
    year: "2026",
    title: "Event Name",
    meta: "Event Time Start and End<br />Event Venue<br />Event Organizer",
  },
  evt4: {
    month: "APR",
    day: "10",
    year: "2026",
    title: "Event Name",
    meta: "Event Time Start and End<br />Event Venue<br />Event Organizer",
  },
};

function catalogKey(id: string) {
  return id.includes("-") ? id.replace("-", "") : id;
}

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

export function DashboardSavedEvents() {
  const [ids, setIds] = useState<string[]>([]);

  const refresh = useCallback(() => setIds(readIds()), []);

  useEffect(() => {
    refresh();
    const onShow = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === DC_SAVED_EVENTS_KEY) refresh();
    };
    const onLocalRefresh = () => refresh();
    window.addEventListener("pageshow", onShow);
    window.addEventListener("storage", onStorage);
    window.addEventListener("dc-refresh-saved", onLocalRefresh);
    return () => {
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("dc-refresh-saved", onLocalRefresh);
    };
  }, [refresh]);

  return (
    <div className="saved-queue-block">
      <h2 className="dashboard-section-title">My Events</h2>
      <p id="saved-events-empty" className="saved-queue-empty" hidden={ids.length > 0}>
        No events saved yet. On Browse Events, use the bookmark on a card to add it here. Open the
        bookmark again to remove it.
      </p>
      <div
        id="saved-events-queue"
        className="event-grid"
        role="region"
        aria-label="My events"
      >
        {ids.map((id) => {
          const ev = CATALOG[catalogKey(id)];
          if (!ev) return null;
          return (
            <Link
              key={id}
              href="/events"
              className="card"
              role="button"
              aria-label="Open Browse Events"
            >
              <div className="card__inner">
                <div className="card__date-col">
                  <div className="card__date">
                    <span className="card__date-month">{ev.month}</span>
                    <span className="card__date-day">{ev.day}</span>
                    <span className="card__date-year">{ev.year}</span>
                  </div>
                </div>
                <div className="card__body">
                  <h2 className="card__event-name">{ev.title}</h2>
                  <p className="card__meta" dangerouslySetInnerHTML={{ __html: ev.meta }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
