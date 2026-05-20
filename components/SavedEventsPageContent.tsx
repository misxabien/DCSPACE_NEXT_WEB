'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { type FrontendEvent, readBrowseEvents, setSelectedBrowseEventId } from '@/lib/dc-events';

const HOME_SAVED_EVENTS_KEY = 'dcspaceHomeSavedEvents';
const filters = ['All', 'Today', 'Tomorrow', 'This Weekend', 'Pick a date'];

function readSavedEventIds() {
  try {
    return JSON.parse(window.localStorage.getItem(HOME_SAVED_EVENTS_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function getEventDate(event: FrontendEvent) {
  const parsedDate = new Date(`${event.month} ${event.day}, ${event.year}`);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getDateFromInput(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getEventTimeDisplay(dateTime: string) {
  const timePart = dateTime.split(',').at(-1)?.trim();

  return timePart || dateTime;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isWithinDateRange(eventDate: Date, startDate: Date, endDate: Date) {
  const normalizedEventDate = new Date(eventDate);
  normalizedEventDate.setHours(0, 0, 0, 0);

  return normalizedEventDate >= startDate && normalizedEventDate <= endDate;
}

function matchesFilter(event: FrontendEvent, activeFilter: string, dateRange: { start: string; end: string }) {
  if (activeFilter === 'All') {
    return true;
  }

  const eventDate = getEventDate(event);

  if (!eventDate) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (activeFilter === 'Pick a date') {
    const startDate = getDateFromInput(dateRange.start);
    const endDate = getDateFromInput(dateRange.end || dateRange.start);

    if (!startDate || !endDate) {
      return true;
    }

    return isWithinDateRange(eventDate, startDate <= endDate ? startDate : endDate, startDate <= endDate ? endDate : startDate);
  }

  if (activeFilter === 'Today') {
    return isSameDate(eventDate, today);
  }

  if (activeFilter === 'Tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return isSameDate(eventDate, tomorrow);
  }

  const day = eventDate.getDay();
  return day === 0 || day === 6;
}

export function SavedEventsPageContent() {
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const refreshEvents = () => {
      setEvents(readBrowseEvents());
      setSavedEventIds(readSavedEventIds());
    };

    refreshEvents();
    window.addEventListener('pageshow', refreshEvents);
    window.addEventListener('storage', refreshEvents);
    window.addEventListener('dcspace-events-updated', refreshEvents);

    return () => {
      window.removeEventListener('pageshow', refreshEvents);
      window.removeEventListener('storage', refreshEvents);
      window.removeEventListener('dcspace-events-updated', refreshEvents);
    };
  }, []);

  const savedEvents = useMemo(() => {
    const savedIds = new Set(savedEventIds);

    return events
      .filter((event) => savedIds.has(event.id))
      .filter((event) => matchesFilter(event, activeFilter, dateRange))
      .filter((event) => {
        const value = searchTerm.trim().toLowerCase();

        if (!value) {
          return true;
        }

        return [event.name, event.venue, event.dateTime, event.organizer, event.department].some((field) =>
          field?.toLowerCase().includes(value),
        );
      });
  }, [activeFilter, dateRange, events, savedEventIds, searchTerm]);

  const removeSavedEvent = (eventId: string) => {
    setSavedEventIds((current) => {
      const nextSavedEventIds = current.filter((savedEventId) => savedEventId !== eventId);

      window.localStorage.setItem(HOME_SAVED_EVENTS_KEY, JSON.stringify(nextSavedEventIds));
      return nextSavedEventIds;
    });
  };

  const handleFilterClick = (filter: string) => {
    if (filter === 'Pick a date') {
      setActiveFilter('Pick a date');
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
    <section className="saved-events-page">
      <header className="saved-events-page__header">
        <div className="saved-events-page__copy">
          <h2>
            All Saved <span>Events</span>
          </h2>
          <div className="saved-events-page__filters" aria-label="Saved event filters">
            {filters.map((filter) => (
              <span className="saved-events-page__filter-wrap" key={filter}>
                <button
                  className={`saved-events-page__filter${activeFilter === filter ? ' is-active' : ''}${
                    filter === 'Pick a date' && showDatePicker ? ' is-open' : ''
                  }`}
                  type="button"
                  onClick={() => handleFilterClick(filter)}
                >
                  <span>{filter}</span>
                  {filter === 'Pick a date' && <Image src="/assets/dropdown-fill.svg" width={8} height={8} alt="" />}
                </button>
                {filter === 'Pick a date' && showDatePicker && (
                  <section className="saved-events-date-picker" aria-label="Choose saved event date">
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
                    <button className="saved-events-date-picker__clear" type="button" onClick={clearPickedDate}>
                      Clear
                    </button>
                  </section>
                )}
              </span>
            ))}
          </div>
        </div>

        <label className="saved-events-page__search">
          <Image src="/assets/searchbar-icon.svg" width={12} height={12} alt="" />
          <input
            type="search"
            aria-label="Search saved events"
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </header>

      {savedEvents.length ? (
        <div className="saved-events-grid" aria-label="Saved events">
          {savedEvents.map((event) => (
            <article className="saved-event-card" key={event.id}>
              <button
                className="saved-event-card__save is-saved"
                type="button"
                aria-label="Unsave event"
                onClick={() => removeSavedEvent(event.id)}
              >
                <Image className="saved-event-card__bookmark-outline" src="/svg icons navbar/Bookmark.svg" width={24} height={24} alt="" />
                <Image className="saved-event-card__bookmark-fill" src="/assets/bookmark-fill.svg" width={24} height={24} alt="" />
              </button>

              <Link className="saved-event-card__link" href="/events/details" onClick={() => setSelectedBrowseEventId(event.id)}>
                <span className="saved-event-card__media" aria-hidden="true">
                  {event.bannerDataUrl && <Image src={event.bannerDataUrl} alt="" fill unoptimized />}
                </span>
                <span className="saved-event-card__content">
                  <span className="saved-event-card__date">
                    <span>{event.month}</span>
                    <strong>{event.day}</strong>
                  </span>
                  <span className="saved-event-card__details">
                    <strong>{event.name}</strong>
                    <span className="saved-event-card__venue">{event.venue}</span>
                    <span className="saved-event-card__time">{getEventTimeDisplay(event.dateTime)}</span>
                  </span>
                </span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <section className="saved-events-empty" aria-label="No saved events">
          <h3>You haven&apos;t saved any events yet.</h3>
          <p>Save events to quickly view them later.</p>
          <Link href="/home">Browse Events</Link>
        </section>
      )}
    </section>
  );
}
