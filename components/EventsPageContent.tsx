"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { fetchEvents, type UserEvent } from "@/lib/user-api";

const today = new Date();
const calendarYear = today.getFullYear();
const calendarMonth = today.getMonth();
const monthName = today.toLocaleString("en-US", { month: "long" });
const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
const calendarDays = [
  ...Array.from({ length: firstDay }, () => null),
  ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
];
const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
type EventCard = {
  id?: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  department: string;
  posterImage?: string;
};

export function EventsPageContent() {
  const [search, setSearch] = useState("");
  const [apiEvents, setApiEvents] = useState<UserEvent[]>([]);

  useEffect(() => {
    fetchEvents(undefined, { status: "all" }).then((response) => setApiEvents(response.events)).catch(() => setApiEvents([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchEvents(search, { status: "all" }).then((response) => setApiEvents(response.events)).catch(() => setApiEvents([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const displayedEvents = useMemo<EventCard[]>(() => {
    return apiEvents.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: `${event.date} ${event.startTime && event.endTime ? `| ${event.startTime} - ${event.endTime}` : ""}`.trim(),
      venue: event.venue,
      department: event.department || event.requester || "Organizer TBA",
      posterImage: event.posterImage || "",
    }));
  }, [apiEvents]);

  return (
    <section className="events-page">
      <section className="events-header">
        <h1 className="events-title">Browse Events</h1>
        <label className="events-search">
          <svg className="events-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M10 18C11.775 17.9996 13.4988 17.4054 14.897 16.312L19.293 20.708L20.707 19.294L16.311 14.898C17.405 13.4997 17.9996 11.7754 18 10C18 5.589 14.411 2 10 2C5.589 2 2 5.589 2 10C2 14.411 5.589 18 10 18ZM10 4C13.309 4 16 6.691 16 10C16 13.309 13.309 16 10 16C6.691 16 4 13.309 4 10C4 6.691 6.691 4 10 4Z"
              fill="currentColor"
            />
          </svg>
          <input className="events-search-input" type="search" aria-label="Search events" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </section>

      {displayedEvents.length > 0 ? (
        <section className="events-content" aria-label="Available events">
          <div className="event-list">
            {displayedEvents.map((event, index) => (
              <article className="browse-event-card" key={`${event.title}-${event.date}-${index}`}>
                <div className="event-image">
                  {event.posterImage ? (
                    <img src={event.posterImage} alt={`${event.title} poster`} className="event-image__img" />
                  ) : (
                    <svg className="folder-icon" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                      <path d="M1.38831 4.72105L2.63783 3.05502L3.60967 4.30454L4.30385 3.47153L5.2757 4.72105H1.38831ZM5.55337 1.66667H3.332L2.77666 1.11133H1.11064C0.963353 1.11133 0.8221 1.16984 0.717954 1.27398C0.613807 1.37813 0.555298 1.51938 0.555298 1.66667V4.99872C0.555298 5.146 0.613807 5.28726 0.717954 5.3914C0.8221 5.49555 0.963353 5.55406 1.11064 5.55406H5.55337C5.70066 5.55406 5.84191 5.49555 5.94605 5.3914C6.0502 5.28726 6.10871 5.146 6.10871 4.99872V2.22201C6.10871 2.07473 6.0502 1.93347 5.94605 1.82933C5.84191 1.72518 5.70066 1.66667 5.55337 1.66667Z" fill="currentColor" />
                    </svg>
                  )}
                </div>
                <div className="event-card-body">
                  <h2>{event.title}</h2>
                  <p>{event.time}</p>
                  <p>{event.venue}</p>
                  <p>{event.department}</p>
                  <Link
                    className="event-details-button"
                    href={
                      event.id
                        ? `/events/details?eventId=${encodeURIComponent(event.id)}&title=${encodeURIComponent(event.title)}&date=${encodeURIComponent(event.date)}&venue=${encodeURIComponent(event.venue)}&organizer=${encodeURIComponent(event.department)}`
                        : "/events/details"
                    }
                  >
                    <span>View Details</span>
                    <svg viewBox="0 0 14 13" fill="none" aria-hidden="true">
                      <path d="M0.262209 11.7641C-0.0942397 12.0519 -0.0861691 12.5132 0.281041 12.7935C0.646905 13.0739 1.23336 13.0675 1.58981 12.7787L8.73493 6.98223L8.0718 6.47548L8.73762 6.98329C9.09407 6.69341 9.086 6.23109 8.71745 5.95074C8.70669 5.94227 8.69593 5.93487 8.68516 5.92746L1.58847 0.220919C1.23202 -0.0678991 0.646905 -0.0742467 0.279695 0.206108C-0.0861691 0.486463 -0.0942397 0.946668 0.262209 1.23549L6.78052 6.47759L0.262209 11.7641Z" fill="currentColor" />
                      <path d="M5.26221 11.7641C4.90576 12.0519 4.91383 12.5132 5.28104 12.7935C5.64691 13.0739 6.23336 13.0675 6.58981 12.7787L13.7349 6.98223L13.0718 6.47548L13.7376 6.98329C14.0941 6.69341 14.086 6.23109 13.7174 5.95074C13.7067 5.94227 13.6959 5.93487 13.6852 5.92746L6.58847 0.220919C6.23202 -0.0678991 5.64691 -0.0742467 5.2797 0.206108C4.91383 0.486463 4.90576 0.946668 5.26221 1.23549L11.7805 6.47759L5.26221 11.7641Z" fill="currentColor" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <aside className="calendar-panel">
            <div className="calendar-header">
              <h2>Calendar</h2>
              <label className="year-select">
                <select defaultValue={String(calendarYear)} aria-label="Filter events by year">
                  <option>{calendarYear}</option>
                  <option>{calendarYear + 1}</option>
                  <option>{calendarYear + 2}</option>
                </select>
              </label>
            </div>

            <div className="mini-calendar" aria-label={`${monthName} ${calendarYear} calendar`}>
              <p className="month-label">{monthName}</p>
              <div className="weekdays">
                {weekdayLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day, index) => {
                  const isToday = day === today.getDate();
                  const isUpcoming = day !== null && day > today.getDate();

                  return (
                    <span
                      className={`${day ? "calendar-day" : "empty-day"}${isToday ? " is-today" : ""}${isUpcoming ? " is-upcoming" : ""}`}
                      key={`${day ?? "blank"}-${index}`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      ) : (
        <EmptyState message="There are currently no events available to browse since no events are ongoing yet. If you would like to create or organize an event, simply click the “+” button." />
      )}
    </section>
  );
}
