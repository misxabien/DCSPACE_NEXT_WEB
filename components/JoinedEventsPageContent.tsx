'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DateRangeCalendarPicker } from '@/components/DateRangeCalendarPicker';
import { getRegisteredEventId, type RegisteredEvent } from '@/lib/attendance';
import { loadRegisteredEvents } from '@/lib/user-data';
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

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

function getEventBanner(event: RegisteredEvent) {
  return (event as RegisteredEvent & { bannerDataUrl?: string }).bannerDataUrl || '';
}

export function JoinedEventsPageContent() {
  const [events, setEvents] = useState<RegisteredEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const refreshEvents = () => {
      void loadRegisteredEvents().then(setEvents);
    };

    void refreshEvents();
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
  const eventDateKeys = useMemo(
    () =>
      events
        .map((event) => getEventDate(event))
        .filter((date): date is Date => Boolean(date))
        .map((date) => getDateInputValue(date)),
    [events],
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

  const clearPickedDate = () => {
    setDateRange({ start: '', end: '' });
    setActiveFilter('All');
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
                  <DateRangeCalendarPicker
                    value={dateRange}
                    highlightedDates={eventDateKeys}
                    onChange={(nextDateRange) => {
                      setDateRange(nextDateRange);
                      setActiveFilter('Pick a date');
                    }}
                    onClear={clearPickedDate}
                    onDone={() => setShowDatePicker(false)}
                  />
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
                  <span className="joined-event-card__media" aria-hidden="true">
                    {getEventBanner(event) && (
                      <Image src={getEventBanner(event)} alt="" fill unoptimized />
                    )}
                  </span>
                  <span className="joined-event-card__content">
                    <span className="joined-event-card__date">
                      <span>{event.month || 'MAY'}</span>
                      <strong>{event.day || '17'}</strong>
                    </span>
                    <span className="joined-event-card__details">
                      <strong>{event.name || 'Event Name'}</strong>
                      <span>{event.venue || 'Event Venue'}</span>
                      <small>{getEventTime(event)}</small>
                    </span>
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
