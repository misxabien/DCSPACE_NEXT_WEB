'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type RegisteredEvent,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  readRegisteredEvents,
} from '@/lib/attendance';
import { canOrganizeEvents, setSelectedBrowseEventId } from '@/lib/dc-events';

type JoinedFilter = 'all' | 'ongoing' | 'upcoming' | 'past';

function getEventDate(event: RegisteredEvent) {
  if (!event.month || !event.day || !event.year) {
    return null;
  }

  const eventDate = new Date(`${event.month} ${event.day}, ${event.year}`);

  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  eventDate.setHours(0, 0, 0, 0);
  return eventDate;
}

function getDaysUntil(event: RegisteredEvent) {
  const eventDate = getEventDate(event);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!eventDate) {
    return null;
  }

  return Math.ceil((eventDate.getTime() - today.getTime()) / 86_400_000);
}

function getEventTime(event: RegisteredEvent) {
  const parts = event.dateTime?.split(',') || [];

  return parts.at(-1)?.trim() || 'Event Time';
}

function getJoinedFilterStatus(event: RegisteredEvent): Exclude<JoinedFilter, 'all'> {
  const daysUntil = getDaysUntil(event);

  if (daysUntil === 0) {
    return 'ongoing';
  }

  if (daysUntil !== null && daysUntil > 0) {
    return 'upcoming';
  }

  return 'past';
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatFilterDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Pick a date';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getEventBanner(event: RegisteredEvent) {
  return (event as RegisteredEvent & { bannerDataUrl?: string }).bannerDataUrl || '';
}

function getCalendarDays(anchorDate: Date) {
  const firstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function isFacultyDashboardUser(user: ReturnType<typeof getCurrentAttendanceUser>) {
  const accountType = typeof window === 'undefined' ? '' : window.localStorage.getItem('dcspaceAccountType') || '';
  const values = [accountType, user.organizationRole, user.organizationPart, user.school, user.studentEmail];

  return values.some((value) => value?.toLowerCase().includes('faculty'));
}

function DashboardQuickActions({ className = '' }: { className?: string }) {
  return (
    <article className={`dashboard-panel officer-actions dashboard-quick-actions${className ? ` ${className}` : ''}`}>
      <h3>Quick Actions</h3>
      <a href="/events-organized/create">
        <Image src="/svg icons for user-dashboard/plus-square-fill.svg" width={18} height={18} alt="" />
        Create Event
      </a>
      <a href="/attendance">
        <Image src="/svg icons for user-dashboard/view-attendance-icon.svg" width={18} height={18} alt="" />
        View Attendance
      </a>
      <button type="button">
        <Image src="/svg icons for user-dashboard/close-registration.svg" width={18} height={18} alt="" />
        Close Registration
      </button>
      <a href="/submit-feedback">
        <Image src="/svg icons for user-dashboard/submit-feedback-icon.svg" width={18} height={18} alt="" />
        Submit Feedback
      </a>
    </article>
  );
}

export function DashboardPageContent() {
  const [firstName, setFirstName] = useState('User');
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [hasQuickActionsAccess, setHasQuickActionsAccess] = useState(false);
  const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>('all');
  const [joinedSearchTerm, setJoinedSearchTerm] = useState('');
  const [selectedJoinedDateRange, setSelectedJoinedDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  useEffect(() => {
    const refreshDashboard = () => {
      const user = getCurrentAttendanceUser();

      setFirstName(user.firstName || 'User');
      setRegisteredEvents(readRegisteredEvents());
      setHasQuickActionsAccess(canOrganizeEvents() || isFacultyDashboardUser(user));
    };

    refreshDashboard();
    window.addEventListener('pageshow', refreshDashboard);
    window.addEventListener('storage', refreshDashboard);
    window.addEventListener('dcspace-events-updated', refreshDashboard);
    window.addEventListener('dcspace-registered-events-updated', refreshDashboard);
    window.addEventListener('dcspace-attendance-updated', refreshDashboard);

    return () => {
      window.removeEventListener('pageshow', refreshDashboard);
      window.removeEventListener('storage', refreshDashboard);
      window.removeEventListener('dcspace-events-updated', refreshDashboard);
      window.removeEventListener('dcspace-registered-events-updated', refreshDashboard);
      window.removeEventListener('dcspace-attendance-updated', refreshDashboard);
    };
  }, []);

  const joinedEventDates = useMemo(
    () =>
      registeredEvents
        .map((event) => getEventDate(event))
        .filter(Boolean) as Date[],
    [registeredEvents],
  );
  const selectedJoinedStartDate = useMemo(
    () => (selectedJoinedDateRange.start ? new Date(`${selectedJoinedDateRange.start}T00:00:00`) : null),
    [selectedJoinedDateRange.start],
  );
  const selectedJoinedEndDate = useMemo(
    () => (selectedJoinedDateRange.end ? new Date(`${selectedJoinedDateRange.end}T00:00:00`) : selectedJoinedStartDate),
    [selectedJoinedDateRange.end, selectedJoinedStartDate],
  );
  const filteredJoinedEvents = useMemo(
    () =>
      registeredEvents.filter((event) => {
        const eventDate = getEventDate(event);
        const searchValue = joinedSearchTerm.trim().toLowerCase();

        if (joinedFilter !== 'all' && getJoinedFilterStatus(event) !== joinedFilter) {
          return false;
        }

        if (
          searchValue &&
          ![event.name, event.venue, event.dateTime, event.organizer].some((field) =>
            field?.toLowerCase().includes(searchValue),
          )
        ) {
          return false;
        }

        if (
          selectedJoinedStartDate &&
          selectedJoinedEndDate &&
          (!eventDate || eventDate < selectedJoinedStartDate || eventDate > selectedJoinedEndDate)
        ) {
          return false;
        }

        return true;
      }),
    [joinedFilter, joinedSearchTerm, registeredEvents, selectedJoinedEndDate, selectedJoinedStartDate],
  );
  const calendarBaseDate = new Date();
  const calendarAnchor = new Date(calendarBaseDate.getFullYear(), calendarBaseDate.getMonth() + calendarMonthOffset, 1);
  const calendarDays = getCalendarDays(calendarAnchor);
  const joinedDateKeys = new Set(joinedEventDates.map((date) => formatDateInputValue(date)));
  const selectedRangeStartTime = selectedJoinedStartDate?.getTime() ?? null;
  const selectedRangeEndTime = selectedJoinedEndDate?.getTime() ?? null;
  const calendarMonthLabel = calendarAnchor.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const dateFilterLabel = selectedJoinedDateRange.start
    ? selectedJoinedDateRange.end
      ? `${formatFilterDateLabel(selectedJoinedDateRange.start)} - ${formatFilterDateLabel(selectedJoinedDateRange.end)}`
      : formatFilterDateLabel(selectedJoinedDateRange.start)
    : 'Pick a date';
  const handleJoinedDatePick = (dateKey: string) => {
    if (!selectedJoinedDateRange.start || selectedJoinedDateRange.end) {
      setSelectedJoinedDateRange({ start: dateKey, end: '' });
      setCalendarMonthOffset(0);
      return;
    }

    if (dateKey === selectedJoinedDateRange.start) {
      setIsDatePickerOpen(false);
      return;
    }

    const startDate = new Date(`${selectedJoinedDateRange.start}T00:00:00`);
    const nextDate = new Date(`${dateKey}T00:00:00`);

    setSelectedJoinedDateRange(
      nextDate < startDate ? { start: dateKey, end: selectedJoinedDateRange.start } : { start: selectedJoinedDateRange.start, end: dateKey },
    );
    setCalendarMonthOffset(0);
    setIsDatePickerOpen(false);
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <h2>Hello, {firstName}!</h2>
          <label className="dashboard-search">
            <Image src="/assets/searchbar-icon.svg" width={12} height={12} alt="" />
            <input
              type="search"
              aria-label="Search joined events"
              placeholder="Search"
              value={joinedSearchTerm}
              onChange={(event) => setJoinedSearchTerm(event.target.value)}
            />
          </label>
        </div>
        {hasQuickActionsAccess && <DashboardQuickActions className="dashboard-quick-actions--mobile" />}

        <section className="dashboard-joined-section" aria-label="Events joined">
          <div className="dashboard-joined-main">
            <h3 className="dashboard-joined-title">
              Events <span>Joined</span>
            </h3>
            <div className="joined-events-filters dashboard-joined-filters">
              {(['all', 'ongoing', 'upcoming', 'past'] as JoinedFilter[]).map((filter) => (
                <button
                  className={`joined-events-filter${joinedFilter === filter ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setJoinedFilter(filter)}
                  key={filter}
                >
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
              <div className="dashboard-date-filter-wrap">
                <button
                  className={`dashboard-date-filter${selectedJoinedDateRange.start ? ' has-value' : ''}${isDatePickerOpen ? ' is-open' : ''}`}
                  type="button"
                  onClick={() => setIsDatePickerOpen((current) => !current)}
                >
                  <span>{dateFilterLabel}</span>
                </button>
                {isDatePickerOpen && (
                  <div className="dashboard-date-picker" aria-label="Pick joined event date">
                    <header>
                      <button type="button" aria-label="Previous month" onClick={() => setCalendarMonthOffset((current) => current - 1)}>&lt;</button>
                      <strong>{calendarMonthLabel}</strong>
                      <button type="button" aria-label="Next month" onClick={() => setCalendarMonthOffset((current) => current + 1)}>&gt;</button>
                    </header>
                    <div className="dashboard-calendar-weekdays" aria-hidden="true">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="dashboard-calendar-days">
                      {calendarDays.map((date) => {
                        const key = formatDateInputValue(date);
                        const time = date.getTime();
                        const isCurrentMonth = date.getMonth() === calendarAnchor.getMonth();
                        const isJoinedDate = joinedDateKeys.has(key);
                        const isSelected =
                          time === selectedRangeStartTime ||
                          (selectedRangeEndTime !== null && time === selectedRangeEndTime);
                        const isInRange =
                          selectedRangeStartTime !== null &&
                          selectedRangeEndTime !== null &&
                          time > selectedRangeStartTime &&
                          time < selectedRangeEndTime;

                        return (
                          <button
                            className={`${isCurrentMonth ? '' : 'is-muted'}${isJoinedDate ? ' is-joined' : ''}${isSelected ? ' is-selected' : ''}${isInRange ? ' is-in-range' : ''}`}
                            type="button"
                            onClick={() => handleJoinedDatePick(key)}
                            key={`picker-${key}`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {selectedJoinedDateRange.start && (
                <button
                  className="dashboard-date-clear"
                  type="button"
                  onClick={() => {
                    setSelectedJoinedDateRange({ start: '', end: '' });
                    setCalendarMonthOffset(0);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {filteredJoinedEvents.length ? (
              <div className="joined-events-grid dashboard-joined-grid">
                {filteredJoinedEvents.map((event) => (
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
              <p className="joined-events-empty dashboard-joined-empty">No joined events found.</p>
            )}
          </div>

          <aside className="dashboard-calendar" aria-label="Joined events calendar">
            {hasQuickActionsAccess && (
              <DashboardQuickActions className="dashboard-quick-actions--desktop" />
            )}
            <h3>Calendar</h3>
            <div className="dashboard-calendar-card">
              <header>
                <button type="button" aria-label="Previous month" onClick={() => setCalendarMonthOffset((current) => current - 1)}>&lt;</button>
                <strong>{calendarMonthLabel}</strong>
                <button type="button" aria-label="Next month" onClick={() => setCalendarMonthOffset((current) => current + 1)}>&gt;</button>
              </header>
              <div className="dashboard-calendar-weekdays" aria-hidden="true">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="dashboard-calendar-days">
                {calendarDays.map((date) => {
                  const key = formatDateInputValue(date);
                  const isCurrentMonth = date.getMonth() === calendarAnchor.getMonth();
                  const isJoinedDate = joinedDateKeys.has(key);

                  return (
                    <button
                      className={`${isCurrentMonth ? '' : 'is-muted'}${isJoinedDate ? ' is-joined' : ''}`}
                      type="button"
                      onClick={() => {
                        setSelectedJoinedDateRange({ start: key, end: '' });
                        setCalendarMonthOffset(0);
                      }}
                      key={key}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </section>
  );
}
