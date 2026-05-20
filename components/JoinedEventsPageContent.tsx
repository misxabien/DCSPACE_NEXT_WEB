'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getRegisteredEventId, readRegisteredEvents, type RegisteredEvent } from '@/lib/attendance';
import { setSelectedBrowseEventId } from '@/lib/dc-events';

const filters = ['All', 'Today', 'Tomorrow', 'This Weekend', 'Pick a date'];

function getEventDate(event: RegisteredEvent) {
  if (!event.month || !event.day || !event.year) return null;

  const date = new Date(`${event.month} ${event.day}, ${event.year}`);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function getDateFromInput(value: string) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isWithinDateRange(eventDate: Date, startDate: Date, endDate: Date) {
  return eventDate >= startDate && eventDate <= endDate;
}

function matchesFilter(event: RegisteredEvent, activeFilter: string, dateRange: { start: string; end: string }) {
  if (activeFilter === 'All') return true;

  const eventDate = getEventDate(event);
  if (!eventDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (activeFilter === 'Today') return isSameDate(eventDate, today);

  if (activeFilter === 'Tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return isSameDate(eventDate, tomorrow);
  }

  if (activeFilter === 'Pick a date') {
    const startDate = getDateFromInput(dateRange.start);
    const endDate = getDateFromInput(dateRange.end || dateRange.start);

    if (!startDate || !endDate) return true;

    return isWithinDateRange(eventDate, startDate <= endDate ? startDate : endDate, startDate <= endDate ? endDate : startDate);
  }

  const day = eventDate.getDay();
  return day === 0 || day === 6;
}

function getEventTime(event: RegisteredEvent) {
  return event.dateTime?.split(',').at(-1)?.trim() || 'Event Time';
}

export function JoinedEventsPageContent() {
  const [events, setEvents] = useState<RegisteredEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const refreshEvents = () => setEvents(readRegisteredEvents());

    refreshEvents();
    window.addEventListener('pageshow', refreshEvents);
    window.addEventListener('storage', refreshEvents);
    window.addEventListener('dcspace-registered-events-updated', refreshEvents);

    return () => {
      window.removeEventListener('pageshow', refreshEvents);
      window.removeEventListener('storage', refreshEvents);
      window.removeEventListener('dcspace-registered-events-updated', refreshEvents);
    };
  }, []);

  const visibleEvents = useMemo(
    () => events.filter((event) => matchesFilter(event, activeFilter, dateRange)),
    [activeFilter, dateRange, events],
  );

  const handleFilterClick = (filter: string) => {
    if (filter === 'Pick a date') {
      setActiveFilter(filter);
      setShowDatePicker((current) => !current);
      return;
    }

    setActiveFilter(filter);
    setShowDatePicker(false);
  };

  return (
    <section className="joined-events-page">
      <div className="joined-events-shell">
        <h2>Events Joined</h2>
        <div className="joined-events-filters" aria-label="Joined event filters">
          {filters.map((filter) => (
            <span className="joined-events-filter-wrap" key={filter}>
              <button
                className={`joined-events-filter${activeFilter === filter ? ' is-active' : ''}`}
                type="button"
                onClick={() => handleFilterClick(filter)}
              >
                {filter}
              </button>
              {filter === 'Pick a date' && showDatePicker && (
                <section className="joined-date-picker" aria-label="Pick joined event date">
                  <label>
                    <span>From</span>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(event) => {
                        setDateRange((current) => ({ ...current, start: event.target.value }));
                        setActiveFilter('Pick a date');
                      }}
                    />
                  </label>
                  <label>
                    <span>To</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      min={dateRange.start || undefined}
                      onChange={(event) => {
                        setDateRange((current) => ({ ...current, end: event.target.value }));
                        setActiveFilter('Pick a date');
                      }}
                    />
                  </label>
                </section>
              )}
            </span>
          ))}
        </div>

        {visibleEvents.length ? (
          <div className="joined-events-grid">
            {visibleEvents.map((event) => (
              <article className="joined-event-card" key={getRegisteredEventId(event)}>
                <Link
                  className="joined-event-card__link"
                  href="/dashboard/events-joined/details"
                  onClick={() => setSelectedBrowseEventId(getRegisteredEventId(event))}
                >
                  <span className="joined-event-card__date">
                    <span>{event.month || 'MAY'}</span>
                    <strong>{event.day || '17'}</strong>
                  </span>
                  <span className="joined-event-card__details">
                    <strong>{event.name || 'Event Name'}</strong>
                    <span>{event.venue || 'Event Venue'}</span>
                    <small>{getEventTime(event)}</small>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="joined-events-empty">You haven&apos;t joined any events yet.</p>
        )}
      </div>
    </section>
  );
}
