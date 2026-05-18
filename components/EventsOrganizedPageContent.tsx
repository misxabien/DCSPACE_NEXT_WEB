'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type RegisteredEvent, readRegisteredEvents } from '@/lib/attendance';
import { type FrontendEvent, readOrganizedEvents, setSelectedBrowseEventId } from '@/lib/dc-events';

type StatusKey = 'upcoming' | 'ongoing' | 'completed' | 'pending';

const statusFilters = ['All', 'Upcoming', 'Ongoing', 'Completed'];
const approvalFilters = ['All', 'Pending', 'Accepted', 'Rejected', 'Drafts'];
const statusMeta: Record<StatusKey, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: '#6b7df2' },
  ongoing: { label: 'Ongoing', color: '#8ab6ff' },
  completed: { label: 'Completed', color: '#f5d29d' },
  pending: { label: 'Pending Approval', color: '#156884' },
};

function getEventDate(event: FrontendEvent) {
  const parsedDate = new Date(`${event.month} ${event.day}, ${event.year}`);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getEventTimeDisplay(dateTime: string) {
  const timePart = dateTime.split(',').at(-1)?.trim();

  return timePart || dateTime;
}

function getEventStatus(event: FrontendEvent): StatusKey {
  const rawStatus = event.status?.toLowerCase() || '';

  if (rawStatus.includes('pending')) return 'pending';
  if (rawStatus.includes('completed') || rawStatus.includes('ended')) return 'completed';
  if (rawStatus.includes('ongoing')) return 'ongoing';

  const eventDate = getEventDate(event);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!eventDate) return 'upcoming';

  eventDate.setHours(0, 0, 0, 0);

  if (eventDate < today) return 'completed';
  if (eventDate.getTime() === today.getTime()) return 'ongoing';
  return 'upcoming';
}

function getDaysUntil(event: FrontendEvent) {
  const eventDate = getEventDate(event);

  if (!eventDate) return Number.POSITIVE_INFINITY;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  return Math.ceil((eventDate.getTime() - today.getTime()) / 86_400_000);
}

function getApprovalStatus(event: FrontendEvent) {
  const rawStatus = event.status?.toLowerCase() || '';

  if (rawStatus.includes('reject')) return 'Rejected';
  if (rawStatus.includes('accept') || rawStatus.includes('approve') || rawStatus.includes('created')) return 'Accepted';
  if (rawStatus.includes('draft')) return 'Drafts';
  return 'Pending';
}

export function EventsOrganizedPageContent() {
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [eventFilter, setEventFilter] = useState('All');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const refreshEvents = () => {
      setEvents(readOrganizedEvents());
      setRegisteredEvents(readRegisteredEvents());
    };

    refreshEvents();
    window.addEventListener('pageshow', refreshEvents);
    window.addEventListener('storage', refreshEvents);
    window.addEventListener('dcspace-events-updated', refreshEvents);
    window.addEventListener('dcspace-registered-events-updated', refreshEvents);

    return () => {
      window.removeEventListener('pageshow', refreshEvents);
      window.removeEventListener('storage', refreshEvents);
      window.removeEventListener('dcspace-events-updated', refreshEvents);
      window.removeEventListener('dcspace-registered-events-updated', refreshEvents);
    };
  }, []);

  const counts = useMemo(
    () =>
      events.reduce<Record<StatusKey, number>>(
        (current, event) => {
          current[getEventStatus(event)] += 1;
          return current;
        },
        { upcoming: 0, ongoing: 0, completed: 0, pending: 0 },
      ),
    [events],
  );
  const totalCount = Math.max(events.length, 1);
  const pieStops = (Object.keys(statusMeta) as StatusKey[]).reduce(
    (current, key) => {
      const percent = (counts[key] / totalCount) * 100;
      const stop = `${statusMeta[key].color} ${current.start}% ${current.start + percent}%`;

      return {
        start: current.start + percent,
        stops: [...current.stops, stop],
      };
    },
    { start: 0, stops: [] as string[] },
  ).stops;

  const visibleEvents = events
    .filter((event) => eventFilter === 'All' || statusMeta[getEventStatus(event)].label === eventFilter)
    .filter((event) => {
      const value = searchTerm.trim().toLowerCase();

      if (!value) return true;

      return [event.name, event.venue, event.dateTime, event.organizer, event.department].some((field) =>
        field?.toLowerCase().includes(value),
      );
    });
  const approvalEvents = events.filter((event) => approvalFilter === 'All' || getApprovalStatus(event) === approvalFilter);
  const timelineEvents = events
    .filter((event) => {
      const days = getDaysUntil(event);
      return days >= 1 && days <= 3;
    })
    .sort((first, second) => getDaysUntil(first) - getDaysUntil(second))
    .slice(0, 3);

  const getRegisteredCount = (eventId: string) => registeredEvents.filter((event) => event.id === eventId).length;

  const renderEventCard = (event: FrontendEvent, approval = false) => {
    const status = approval ? getApprovalStatus(event) : statusMeta[getEventStatus(event)].label;

    return (
      <article className="organized-event-card" key={event.id}>
        <Link
          className="organized-event-card__link"
          href="/dashboard/organized-event"
          onClick={() => setSelectedBrowseEventId(event.id)}
        >
          <span className="organized-event-card__date">
            <span>{event.month}</span>
            <strong>{event.day}</strong>
          </span>
          <span className="organized-event-card__details">
            <strong>{event.name || 'Event Name'}</strong>
            <span className="organized-event-card__venue">{event.venue || 'Event Venue'}</span>
            <span className="organized-event-card__time">{getEventTimeDisplay(event.dateTime)}</span>
            <span className="organized-event-card__status-row">
              <span>{status}</span>
              {!approval && <span>{getRegisteredCount(event.id)} Registered</span>}
            </span>
          </span>
        </Link>
      </article>
    );
  };

  return (
    <section className="organized-page">
      <section className="organized-create-banner">
        <div>
          <h2>
            Create an Event with <span>DC Space</span>
          </h2>
          <p>Got an event, seminar, or organization activity? Create and manage your event with DC Space.</p>
        </div>
        <Link className="organized-create-banner__button" href="/events-organized/create">
          <Image src="/svg icons organized events page/create-events-icon.svg" width={15} height={15} alt="" />
          <span>Create Event</span>
        </Link>
      </section>

      <section className="organized-section">
        <div className="organized-section__header">
          <div>
            <h2>
              All Organized <span>Events</span>
            </h2>
            <div className="organized-filter-row">
              {statusFilters.map((filter) => (
                <button
                  className={eventFilter === filter ? 'is-active' : ''}
                  type="button"
                  key={filter}
                  onClick={() => setEventFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <label className="organized-search">
            <Image src="/assets/searchbar-icon.svg" width={12} height={12} alt="" />
            <input
              type="search"
              aria-label="Search organized events"
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
        <div className="organized-event-grid">{visibleEvents.map((event) => renderEventCard(event))}</div>
      </section>

      <section className="organized-section">
        <div className="organized-section__header">
          <div>
            <h2>
              Pending <span>Event Approvals</span>
            </h2>
            <div className="organized-filter-row">
              {approvalFilters.map((filter) => (
                <button
                  className={approvalFilter === filter ? 'is-active' : ''}
                  type="button"
                  key={filter}
                  onClick={() => setApprovalFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="organized-event-grid">{approvalEvents.map((event) => renderEventCard(event, true))}</div>
      </section>

      <section className="organized-section organized-summary">
        <h2>
          Quick <span>Summary</span>
        </h2>
        <div className="organized-summary__grid">
          <article className="organized-panel organized-timeline">
            <h3>Upcoming Events Timeline</h3>
            {timelineEvents.length ? (
              timelineEvents.map((event) => (
                <p key={event.id}>
                  <span className="organized-dot" />
                  <strong>{event.name || 'Event Name'}</strong>
                  <small>{event.dateTime}</small>
                </p>
              ))
            ) : (
              <p className="organized-empty">No upcoming events</p>
            )}
          </article>
          <article className="organized-panel organized-status-counts">
            <h3>Events Status Counts</h3>
            <div className="organized-status-counts__body">
              <div
                className="organized-status-pie"
                style={{ background: events.length ? `conic-gradient(${pieStops.join(', ')})` : '#1c1d21' }}
                aria-hidden="true"
              />
              <div className="organized-status-legend">
                {(Object.keys(statusMeta) as StatusKey[]).map((key) => (
                  <p key={key}>
                    <span className="organized-status-dot" style={{ '--dot-color': statusMeta[key].color } as CSSProperties} />
                    <strong>{statusMeta[key].label}</strong>
                    <small>{Math.round((counts[key] / totalCount) * 100)}%</small>
                  </p>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
