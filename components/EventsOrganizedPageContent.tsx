'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

  const getRegisteredCount = (eventId: string) => registeredEvents.filter((event) => event.id === eventId).length;

  const renderEventCard = (event: FrontendEvent, approval = false) => {
    const status = approval ? getApprovalStatus(event) : statusMeta[getEventStatus(event)].label;
    const handleOpenEventDetails = () => {
      window.sessionStorage.setItem('dcspaceDashboardView', 'organized');
      setSelectedBrowseEventId(event.id);
    };

    return (
      <article className="organized-event-card" key={event.id}>
        <Link
          className="organized-event-card__link"
          href="/dashboard/organized-event"
          onClick={handleOpenEventDetails}
        >
          <span className="organized-event-card__media" aria-hidden="true">
            {event.bannerDataUrl && <Image src={event.bannerDataUrl} alt="" fill unoptimized />}
          </span>
          <span className="organized-event-card__content">
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
        {visibleEvents.length ? (
          <div className="organized-event-grid">{visibleEvents.map((event) => renderEventCard(event))}</div>
        ) : (
          <p className="organized-empty">You haven’t organized any events yet.</p>
        )}
      </section>

      <section className="organized-section">
        <div className="organized-section__header">
          <div>
            <h2>
              Event <span>Submissions</span>
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
        {approvalEvents.length ? (
          <div className="organized-event-grid">{approvalEvents.map((event) => renderEventCard(event, true))}</div>
        ) : (
          <p className="organized-empty">You have no pending event requests.</p>
        )}
      </section>

    </section>
  );
}
