"use client";

import { EventBookmarkButton, EventsBookmarks } from "@/components/EventsBookmarks";
import { SearchWithClear } from "@/components/SearchWithClear";

const EVENTS = [
  { id: "evt-1", variant: "event-card--cream" as const },
  { id: "evt-2", variant: "event-card--white" as const },
  { id: "evt-3", variant: "event-card--cream" as const },
  { id: "evt-4", variant: "event-card--white" as const },
];

function EventCta() {
  return (
    <button className="event-card__cta" type="button">
      <span className="cta__label--details">View Details</span>
      <span className="cta__label--join">Join</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6l6 6-6 6"
        />
      </svg>
    </button>
  );
}

export function EventsPageContent() {
  return (
    <EventsBookmarks>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Browse Events</h1>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Layout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button type="button" className="main__tool" aria-label="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <section className="main__detail-wrap">
        <SearchWithClear />

        <div className="list">
          {EVENTS.map(({ id, variant }) => (
            <article key={id} className={`event-card ${variant}`} data-event-id={id}>
              <div
                className="event-card__media"
                role="img"
                aria-label="Event publication material placeholder"
              >
                or pubmat
              </div>
              <div className="event-card__body">
                <EventBookmarkButton eventId={id} />
                <h2 className="event-name">Event Name</h2>
                <p className="event-meta">Event Date and Time</p>
                <p className="event-meta">Event Venue</p>
                <p className="event-meta">Event Representative or Organizer</p>
                <div className="event-card__actions">
                  <EventCta />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </EventsBookmarks>
  );
}
