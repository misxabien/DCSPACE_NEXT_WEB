'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { type FrontendEvent, readBrowseEvents, setSelectedBrowseEventId } from '@/lib/dc-events';

const HOME_SAVED_EVENTS_KEY = 'dcspaceHomeSavedEvents';
const filters = ['All', 'Today', 'Tomorrow', 'This Weekend', 'Pick a date'];

function readSavedHomeEvents() {
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

export function HomePageContent() {
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const refreshEvents = () => {
      setEvents(readBrowseEvents());
      setSavedEventIds(readSavedHomeEvents());
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

  const visibleEvents = useMemo(
    () =>
      events
        .filter((event) => matchesFilter(event, activeFilter, dateRange))
        .filter((event) => {
          const value = searchTerm.trim().toLowerCase();

          if (!value) {
            return true;
          }

          return [event.name, event.venue, event.dateTime, event.organizer, event.department].some((field) =>
            field?.toLowerCase().includes(value),
          );
        }),
    [activeFilter, dateRange, events, searchTerm],
  );

  const toggleSavedEvent = (eventId: string) => {
    setSavedEventIds((current) => {
      const nextSavedEventIds = current.includes(eventId)
        ? current.filter((savedEventId) => savedEventId !== eventId)
        : [...current, eventId];

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
    <section className="home-page">
      <header className="home-page__header">
        <div className="home-page__copy">
          <h2>
            Upcoming <span>Events</span>
          </h2>
          <div className="home-page__filters" aria-label="Event filters">
            {filters.map((filter) => (
              <span className="home-page__filter-wrap" key={filter}>
                <button
                  className={`home-page__filter${activeFilter === filter ? ' is-active' : ''}${filter === 'Pick a date' && showDatePicker ? ' is-open' : ''}`}
                  type="button"
                  onClick={() => handleFilterClick(filter)}
                >
                  <span>{filter}</span>
                  {filter === 'Pick a date' && <Image src="/assets/dropdown-fill.svg" width={8} height={8} alt="" />}
                </button>
                {filter === 'Pick a date' && showDatePicker && (
                  <section className="home-date-picker" aria-label="Choose event date">
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
                    <button className="home-date-picker__clear" type="button" onClick={clearPickedDate}>
                      Clear
                    </button>
                  </section>
                )}
              </span>
            ))}
          </div>
        </div>

        <label className="home-page__search">
          <Image src="/assets/searchbar-icon.svg" width={12} height={12} alt="" />
          <input
            type="search"
            aria-label="Search events"
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </header>

      <div className="home-event-grid" aria-label="Upcoming events">
        {visibleEvents.map((event) => {
          const isSaved = savedEventIds.includes(event.id);

          return (
            <article className="home-event-card" key={event.id}>
              <button
                className={`home-event-card__save${isSaved ? ' is-saved' : ''}`}
                type="button"
                aria-label={isSaved ? 'Unsave event' : 'Save event'}
                onClick={() => toggleSavedEvent(event.id)}
              >
                <Image
                  className="home-event-card__bookmark-outline"
                  src="/svg icons navbar/Bookmark.svg"
                  width={24}
                  height={24}
                  alt=""
                />
                <Image
                  className="home-event-card__bookmark-fill"
                  src="/assets/bookmark-fill.svg"
                  width={24}
                  height={24}
                  alt=""
                />
              </button>

              <Link className="home-event-card__link" href="/home/details" onClick={() => setSelectedBrowseEventId(event.id)}>
                <span className="home-event-card__date">
                  <span>{event.month}</span>
                  <strong>{event.day}</strong>
                </span>
                <span className="home-event-card__details">
                  <strong>{event.name}</strong>
                  <span className="home-event-card__venue">{event.venue}</span>
                  <span className="home-event-card__time">{getEventTimeDisplay(event.dateTime)}</span>
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
