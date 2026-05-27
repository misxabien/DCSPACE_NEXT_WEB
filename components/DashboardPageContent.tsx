'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type RegisteredEvent,
  getCurrentAttendanceUser,
  getRegisteredEventId,
<<<<<<< HEAD
} from '@/lib/attendance';
import { setSelectedBrowseEventId } from '@/lib/dc-events';
import { loadRegisteredEvents, userCanOrganize } from '@/lib/user-data';
=======
  readRegisteredEvents,
} from '@/lib/attendance';
import { canOrganizeEvents, setSelectedBrowseEventId } from '@/lib/dc-events';
>>>>>>> origin/frontend-user

<<<<<<< HEAD
type JoinedFilter = 'all' | 'ongoing' | 'upcoming' | 'past';
=======
type RegisteredEvent = {
  id?: string;
  month: string;
  day: string;
  year: string;
  name: string;
  dateTime: string;
  venue: string;
  organizer: string;
  posterImage?: string;
};
>>>>>>> backup/backend-user

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
<<<<<<< HEAD
  const [firstName, setFirstName] = useState('User');
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [hasQuickActionsAccess, setHasQuickActionsAccess] = useState(false);
  const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>('all');
  const [joinedSearchTerm, setJoinedSearchTerm] = useState('');
  const [selectedJoinedDateRange, setSelectedJoinedDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  useEffect(() => {
<<<<<<< HEAD
    let cancelled = false;

    const refreshDashboard = async () => {
      const user = getCurrentAttendanceUser();
      const registered = await loadRegisteredEvents();

      if (cancelled) return;

      setFirstName(user.firstName || 'User');
      setRegisteredEvents(registered);
      setHasQuickActionsAccess(userCanOrganize() || isFacultyDashboardUser(user));
    };

    void refreshDashboard();
    window.addEventListener('pageshow', () => void refreshDashboard());
    window.addEventListener('storage', () => void refreshDashboard());
    window.addEventListener('dcspace-events-updated', () => void refreshDashboard());
    window.addEventListener('dcspace-registered-events-updated', () => void refreshDashboard());
    window.addEventListener('dcspace-attendance-updated', () => void refreshDashboard());

    return () => {
      cancelled = true;
=======
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
>>>>>>> origin/frontend-user
    };
  }, []);

  const joinedEventDates = useMemo(
=======
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeDashboardView, setActiveDashboardView] = useState<"registered" | "organized">("registered");
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [organizedEvents, setOrganizedEvents] = useState<UserEvent[]>([]);
  const [organizedError, setOrganizedError] = useState("");

  const isRegisteredView = activeDashboardView === "registered";

  const registeredEventsBySection = useMemo(
>>>>>>> backup/backend-user
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

<<<<<<< HEAD
        if (joinedFilter !== 'all' && getJoinedFilterStatus(event) !== joinedFilter) {
          return false;
        }
=======
  useEffect(() => {
    setShowPrivacyModal(window.sessionStorage.getItem("dcspacePrivacySeen") !== "true");
  }, []);

  useEffect(() => {
    const readRegisteredEvents = () => {
      try {
        const byKey = new Map<string, RegisteredEvent>();

        const rawReg = window.localStorage.getItem(registeredEventsStorageKey);
        if (rawReg) {
          const parsed = JSON.parse(rawReg) as RegisteredEvent[];
          if (Array.isArray(parsed)) {
            for (const event of parsed) {
              const name = String(event?.name || "").trim().toLowerCase();
              if (!name.length || name === "event name") continue;
              const key = `${String(event.name)}|${String(event.dateTime)}`;
              byKey.set(key, event);
            }
          }
        }

        const rawBridge = window.localStorage.getItem("dcspaceRegisteredEvents");
        if (rawBridge) {
          const parsed = JSON.parse(rawBridge) as Array<Record<string, unknown>>;
          if (Array.isArray(parsed)) {
            for (const ev of parsed) {
              const name = String(ev.name || "").trim();
              if (!name || name.toLowerCase() === "event name") continue;
              const dateTime = String(ev.dateTime || "");
              const key = `${name}|${dateTime}`;
              if (byKey.has(key)) continue;
              byKey.set(key, {
                id: typeof ev.id === "string" ? ev.id : undefined,
                month: String(ev.month || ""),
                day: String(ev.day || ""),
                year: String(ev.year || ""),
                name,
                dateTime,
                venue: String(ev.venue || ""),
                organizer: String(ev.organizer || ""),
                posterImage: typeof ev.posterImage === "string" ? ev.posterImage : "",
              });
            }
          }
        }

        setRegisteredEvents(Array.from(byKey.values()));
      } catch {
        setRegisteredEvents([]);
      }
    };
>>>>>>> backup/backend-user

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

<<<<<<< HEAD
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
=======
          {isRegisteredView ? (
            registeredEvents.length > 0 ? (
              <section className="registered-sections" aria-label="Registered events">
                {registeredEventsBySection.map(
                  (section) =>
                    section.events.length > 0 && (
                      <section className="registered-group" key={section.key} aria-labelledby={`${section.key}-events-title`}>
                        <h2 className="registered-group-title" id={`${section.key}-events-title`}>
                          {section.title}
                        </h2>

                        <div className="registered-grid">
                          {section.events.map((event, index) => (
                            <Link
                              className="registered-card"
                              href={getRegisteredEventDetailsHref(event)}
                              key={`${section.key}-${event.name}-${index}`}
                            >
                              {event.posterImage ? (
                                <span className="registered-poster" aria-hidden="true">
                                  <img src={event.posterImage} alt="" />
                                </span>
                              ) : null}
                              <span className="registered-date">
                                <span>{event.month}</span>
                                <strong>{event.day}</strong>
                                <span>{event.year}</span>
                              </span>

                              <span className="registered-details">
                                <strong>{event.name}</strong>
                                <span>{event.dateTime}</span>
                                <span>{event.venue}</span>
                                <span>{event.organizer}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ),
                )}
              </section>
            ) : (
              <EmptyState message="No registered events found. Browse the Events tab and select an event to register. Once joined, your upcoming sessions will appear here." />
            )
          ) : organizedEvents.length > 0 ? (
            <section className="organized-table" aria-label="Organized events">
              <div className="organized-row organized-header">
                <span>Poster</span>
                <span>Event Name</span>
                <span>Date</span>
                <span>Event Status</span>
                <span>E-Certificate</span>
                <span aria-hidden="true" />
              </div>

                {organizedEvents.map((event, index) => (
                  <div className="organized-row" key={`${event.id}-${index}`}>
                    <span className="organized-poster" aria-hidden="true">
                      {event.posterImage ? <img src={event.posterImage} alt="" /> : <span className="organized-poster--empty" />}
                    </span>
                    <span>{event.title}</span>
                    <span>{event.date}</span>
                    <span>{event.status || "pending"}</span>
                    <span>{event.certificate || "Processing"}</span>
                    <Link
                      className="details-button"
                      href={{
                        pathname: "/dashboard/registered-event",
                        query: {
                          eventId: event.id,
                          ...toDateQueryFromIso(event.date),
                          title: event.title,
                          date: `${event.date}${event.startTime && event.endTime ? ` | ${event.startTime} - ${event.endTime}` : ""}`,
                          venue: event.venue,
                          organizer: event.requester || event.department || "DC Space",
                        },
                      }}
                    >
                      View Details
                      <svg viewBox="0 0 14 13" fill="none" aria-hidden="true">
                        <path
                          d="M0.262209 11.7641C-0.0942397 12.0519 -0.0861691 12.5132 0.281041 12.7935C0.646905 13.0739 1.23336 13.0675 1.58981 12.7787L8.73493 6.98223L8.0718 6.47548L8.73762 6.98329C9.09407 6.69341 9.086 6.23109 8.71745 5.95074C8.70669 5.94227 8.69593 5.93487 8.68516 5.92746L1.58847 0.220919C1.23202 -0.0678991 0.646905 -0.0742467 0.279695 0.206108C-0.0861691 0.486463 -0.0942397 0.946668 0.262209 1.23549L6.78052 6.47759L0.262209 11.7641Z"
                          fill="currentColor"
                        />
                        <path
                          d="M5.26221 11.7641C4.90576 12.0519 4.91383 12.5132 5.28104 12.7935C5.64691 13.0739 6.23336 13.0675 6.58981 12.7787L13.7349 6.98223L13.0718 6.47548L13.7376 6.98329C14.0941 6.69341 14.086 6.23109 13.7174 5.95074C13.7067 5.94227 13.6959 5.93487 13.6852 5.92746L6.58847 0.220919C6.23202 -0.0678991 5.64691 -0.0742467 5.2797 0.206108C4.91383 0.486463 4.90576 0.946668 5.26221 1.23549L11.7805 6.47759L5.26221 11.7641Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </section>
            ) : (
              <EmptyState message="No organized events yet. If you would like to create or manage an event, click the plus button." />
            )
          }
          {organizedError && <p className="auth-field-error">{organizedError}</p>}
        </section>
      </div>

      {showPrivacyModal && (
        <div className="privacy-overlay">
          <section className="privacy-card" aria-modal="true" role="dialog" aria-labelledby="privacy-modal-title">
            <header className="privacy-header">
              <h2 id="privacy-modal-title">Agreement &amp; Data Privacy</h2>
            </header>

            <div className="privacy-body">
              <div className="notice-row">
                <div className="notice-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M2 2H11.5V13H2V2Z" />
                    <path d="M2 17H22V21.5H2V17Z" />
                    <path d="M15.5 2H22V6H15.5V2Z" />
                    <path d="M15.5 9H22V13H15.5V9Z" />
                  </svg>
                </div>
                <h3 className="notice-title">Data Privacy Notice</h3>
>>>>>>> backup/backend-user
              </div>
              <div className="dashboard-calendar-days">
                {calendarDays.map((date) => {
                  const key = formatDateInputValue(date);
                  const isCurrentMonth = date.getMonth() === calendarAnchor.getMonth();
                  const isJoinedDate = joinedDateKeys.has(key);

<<<<<<< HEAD
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
=======
              <p className="notice-text">
                This application, DC Space, collects and processes your personal data to facilitate
                e-certificate issuance and attendance tracking. We are committed to protecting your privacy
                and will use your information only for account verification and event record management.
              </p>

              <h3 className="consent-title">Consent</h3>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(event) => setConsentChecked(event.target.checked)}
                />
                <span>
                  I have read and agree to the Data Privacy Notice and give my consent for the
                  collection and processing of my personal data.
                </span>
              </label>

              {showValidation && <p className="validation-text">Please check the consent box before continuing.</p>}

              <div className="privacy-actions">
                <button type="button" className="accept-button" onClick={handleAccept}>
                  Accept &amp; Continue
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
>>>>>>> backup/backend-user
              </div>
            </div>
          </aside>
        </section>
      </div>
    </section>
  );
}