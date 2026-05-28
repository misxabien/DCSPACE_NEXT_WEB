'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { type FrontendEvent, setSelectedBrowseEventId } from '@/lib/dc-events';
import { loadBookmarkedEvents } from '@/lib/user-data';

function getEventTimeDisplay(dateTime: string) {
  const timePart = dateTime.split(',').at(-1)?.trim();
  return timePart || dateTime;
}

export function DashboardSavedEvents() {
  const [events, setEvents] = useState<FrontendEvent[]>([]);

  const refresh = useCallback(() => {
    void loadBookmarkedEvents().then(setEvents);
  }, []);

  useEffect(() => {
    refresh();
    const onShow = () => refresh();
    const onLocalRefresh = () => refresh();
    window.addEventListener('pageshow', onShow);
    window.addEventListener('storage', onLocalRefresh);
    window.addEventListener('dcspace-events-updated', onLocalRefresh);
    window.addEventListener('dc-refresh-saved', onLocalRefresh);
    return () => {
      window.removeEventListener('pageshow', onShow);
      window.removeEventListener('storage', onLocalRefresh);
      window.removeEventListener('dcspace-events-updated', onLocalRefresh);
      window.removeEventListener('dc-refresh-saved', onLocalRefresh);
    };
  }, [refresh]);

  return (
    <div className="saved-queue-block">
      <h2 className="dashboard-section-title">My Events</h2>
      <p id="saved-events-empty" className="saved-queue-empty" hidden={events.length > 0}>
        No events saved yet. On Browse Events, use the bookmark on a card to add it here. Open the
        bookmark again to remove it.
      </p>
      <div
        id="saved-events-queue"
        className="event-grid"
        role="region"
        aria-label="My events"
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href="/events/details"
            className="card"
            role="button"
            aria-label={`Open ${event.name}`}
            onClick={() => setSelectedBrowseEventId(event.id)}
          >
            <div className="card__inner">
              <div className="card__date-col">
                <div className="card__date">
                  <span className="card__date-month">{event.month}</span>
                  <span className="card__date-day">{event.day}</span>
                  <span className="card__date-year">{event.year}</span>
                </div>
              </div>
              <div className="card__body">
                <h2 className="card__event-name">{event.name}</h2>
                <p className="card__meta">
                  {getEventTimeDisplay(event.dateTime)}
                  <br />
                  {event.venue}
                  <br />
                  {event.organizer}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
