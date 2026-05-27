'use client';

<<<<<<< HEAD
import Link from 'next/link';
import Image from 'next/image';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DateRangeCalendarPicker } from '@/components/DateRangeCalendarPicker';
import {
  ATTENDANCE_UPDATED_EVENT,
  REGISTERED_EVENTS_KEY,
  type AttendanceRecord,
  type EventStatus,
  type RegisteredEvent,
  getRequirementStatus,
<<<<<<< HEAD
  getEventStatus,
  getRegisteredEventId,
  recordRfidAttendanceTap,
  setSelectedAttendanceEvent,
} from '@/lib/attendance';
import { loadAttendanceRecords, loadRegisteredEvents } from '@/lib/user-data';
=======
  getCurrentAttendanceUser,
  getEventStatus,
  getRegisteredEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
  recordRfidAttendanceTap,
  setSelectedAttendanceEvent,
} from '@/lib/attendance';
>>>>>>> origin/frontend-user

const attendanceFilters = ['All', 'Yesterday', 'This Week', 'Pick a date'];

type AttendanceEvent = {
  id: string;
  name: string;
  status: EventStatus;
  registeredEvent: RegisteredEvent;
  record?: AttendanceRecord;
};

function buildAttendanceEvents(
  registeredEvents: RegisteredEvent[],
  records: Record<string, AttendanceRecord>,
): AttendanceEvent[] {
  return registeredEvents.map((event) => {
    const id = getRegisteredEventId(event);
    const record = records[id];

    return {
      id,
      name: event.name || 'Event Name',
      status: getEventStatus(event),
      registeredEvent: event,
      record,
    };
  });
}

function getAttendanceEventTime(event: AttendanceEvent) {
  const eventDate = new Date(`${event.registeredEvent.month} ${event.registeredEvent.day}, ${event.registeredEvent.year}`);
  return Number.isNaN(eventDate.getTime()) ? 0 : eventDate.getTime();
}

function getAttendanceEventDate(event: AttendanceEvent) {
  const eventDate = new Date(`${event.registeredEvent.month} ${event.registeredEvent.day}, ${event.registeredEvent.year}`);
  if (Number.isNaN(eventDate.getTime())) return null;

  eventDate.setHours(0, 0, 0, 0);
  return eventDate;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateFromInput(value: string) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return getDateInputValue(firstDate) === getDateInputValue(secondDate);
}

function isThisWeek(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return date >= startOfWeek && date <= endOfWeek;
}

function matchesAttendanceFilter(
  event: AttendanceEvent,
  activeFilter: string,
  dateRange: { start: string; end: string },
) {
  if (activeFilter === 'All') return true;

  const eventDate = getAttendanceEventDate(event);
  if (!eventDate) return true;

  if (activeFilter === 'Yesterday') {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDate(eventDate, yesterday);
  }

  if (activeFilter === 'This Week') {
    return isThisWeek(eventDate);
  }

  if (activeFilter === 'Pick a date') {
    const startDate = getDateFromInput(dateRange.start);
    const endDate = getDateFromInput(dateRange.end || dateRange.start);

    if (!startDate || !endDate) return true;

    return eventDate >= (startDate <= endDate ? startDate : endDate) && eventDate <= (startDate <= endDate ? endDate : startDate);
  }

  return true;
}

function getEventTimeDisplay(dateTime?: string) {
  return dateTime?.split(',').at(-1)?.trim() || 'Event Time';
}

function getEventBanner(event: RegisteredEvent) {
  return (event as RegisteredEvent & { bannerDataUrl?: string }).bannerDataUrl || '';
}

function getAttendanceDateKeys(events: AttendanceEvent[]) {
  return events
    .map((event) => getAttendanceEventDate(event))
    .filter((date): date is Date => Boolean(date))
    .map((date) => getDateInputValue(date));
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)
  );
}
=======
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SearchWithClear } from "@/components/SearchWithClear";
import { readAuthSession } from "@/lib/user-api";
>>>>>>> backup/backend-user

type DisplayRow = {
  name: string;
  date: string;
  status: string;
  certificate: string;
};

export function AttendancePageContent() {
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [completedFilter, setCompletedFilter] = useState('All');
  const [incompleteFilter, setIncompleteFilter] = useState('All');
  const [completedDateRange, setCompletedDateRange] = useState({ start: '', end: '' });
  const [incompleteDateRange, setIncompleteDateRange] = useState({ start: '', end: '' });
  const [openDatePicker, setOpenDatePicker] = useState<'completed' | 'incomplete' | null>(null);
  const registeredEventsRef = useRef<RegisteredEvent[]>([]);
  const scanBufferRef = useRef('');
  const scanTimeoutRef = useRef<number | null>(null);

<<<<<<< HEAD
  const loadAttendanceEvents = useCallback(() => {
<<<<<<< HEAD
    void (async () => {
      const registeredEvents = await loadRegisteredEvents();
      const records = await loadAttendanceRecords();

      registeredEventsRef.current = registeredEvents;
      setAttendanceEvents(buildAttendanceEvents(registeredEvents, records));
    })();
=======
    const user = getCurrentAttendanceUser();
    const registeredEvents = readRegisteredEvents();
    const records = readUserAttendanceRecords(user);

    registeredEventsRef.current = registeredEvents;
    setAttendanceEvents(buildAttendanceEvents(registeredEvents, records));
>>>>>>> origin/frontend-user
  }, []);

  useEffect(() => {
    loadAttendanceEvents();

    const handleRefresh = () => loadAttendanceEvents();
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === REGISTERED_EVENTS_KEY || event.key.startsWith('dcspaceAttendanceRecords:')) {
        loadAttendanceEvents();
      }
    };

    window.addEventListener('pageshow', handleRefresh);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, handleRefresh);

    return () => {
      window.removeEventListener('pageshow', handleRefresh);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, handleRefresh);
    };
  }, [loadAttendanceEvents]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) {
        return;
      }

      if (scanTimeoutRef.current) {
        window.clearTimeout(scanTimeoutRef.current);
      }

      if (event.key === 'Enter') {
        const scannedRfid = scanBufferRef.current.trim();
        scanBufferRef.current = '';

        if (!scannedRfid) return;

        const result = recordRfidAttendanceTap(scannedRfid, registeredEventsRef.current);

        if (result.ok) {
          loadAttendanceEvents();
        }

        return;
      }

      if (event.key.length === 1) {
        scanBufferRef.current += event.key;
        scanTimeoutRef.current = window.setTimeout(() => {
          scanBufferRef.current = '';
        }, 1200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      if (scanTimeoutRef.current) {
        window.clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [loadAttendanceEvents]);

  const sortedAttendanceEvents = useMemo(() => {
    return [...attendanceEvents].sort((firstEvent, secondEvent) => {
      const firstTime = getAttendanceEventTime(firstEvent);
      const secondTime = getAttendanceEventTime(secondEvent);

      return firstTime - secondTime;
    });
  }, [attendanceEvents]);

  const ongoingEvents = useMemo(
    () => sortedAttendanceEvents.filter((event) => event.status === 'Ongoing'),
    [sortedAttendanceEvents],
  );
  const completedEvents = sortedAttendanceEvents.filter((event) => {
    const status = getRequirementStatus(event.record, event.registeredEvent);
    return status === 'Complete' || status === 'Overtime';
  });
  const incompleteEvents = sortedAttendanceEvents.filter((event) => {
    const status = getRequirementStatus(event.record, event.registeredEvent);
    return event.status === 'Passed' && status !== 'Complete' && status !== 'Overtime';
  });
  const filteredCompletedEvents = completedEvents.filter((event) => (
    matchesAttendanceFilter(event, completedFilter, completedDateRange)
  ));
  const filteredIncompleteEvents = incompleteEvents.filter((event) => (
    matchesAttendanceFilter(event, incompleteFilter, incompleteDateRange)
  ));

  const renderAttendanceFilters = (
    group: 'completed' | 'incomplete',
    activeFilter: string,
    dateRange: { start: string; end: string },
    setActiveFilter: (filter: string) => void,
    setDateRange: Dispatch<SetStateAction<{ start: string; end: string }>>,
    highlightedDates: string[],
  ) => (
    <div className="attendance-filters" aria-label={`${group} attendance filters`}>
      {attendanceFilters.map((filter) => (
        <span className="attendance-filter-wrap" key={filter}>
          <button
            className={`attendance-filter${filter === 'Pick a date' ? ' has-date-picker' : ''}${activeFilter === filter ? ' is-active' : ''}${filter === 'Pick a date' && openDatePicker === group ? ' is-open' : ''}`}
            type="button"
            aria-pressed={activeFilter === filter}
            onClick={() => {
              setActiveFilter(filter);
              setOpenDatePicker(filter === 'Pick a date' ? (openDatePicker === group ? null : group) : null);
            }}
          >
            {filter}
          </button>
          {filter === 'Pick a date' && openDatePicker === group && (
            <section className="attendance-date-picker" aria-label={`Choose ${group} attendance date`}>
              <DateRangeCalendarPicker
                value={dateRange}
                highlightedDates={highlightedDates}
                onChange={(nextDateRange) => {
                  setDateRange(nextDateRange);
                  setActiveFilter('Pick a date');
                }}
                onClear={() => {
                  setDateRange({ start: '', end: '' });
                  setActiveFilter('All');
                  setOpenDatePicker(null);
                }}
                onDone={() => setOpenDatePicker(null)}
              />
            </section>
          )}
        </span>
      ))}
    </div>
  );

  const renderAttendanceCard = (event: AttendanceEvent) => (
    <article className="attendance-event-card" key={event.id}>
      <Link
        className="attendance-event-card__link"
        href="/attendance/details"
        onClick={() => setSelectedAttendanceEvent(event.id)}
      >
        <span className="attendance-event-card__media" aria-hidden="true">
          {getEventBanner(event.registeredEvent) && (
            <Image src={getEventBanner(event.registeredEvent)} alt="" fill unoptimized />
          )}
        </span>
        <span className="attendance-event-card__content">
          <span className="attendance-event-card__date">
            <span>{event.registeredEvent.month || 'MAY'}</span>
            <strong>{event.registeredEvent.day || '17'}</strong>
          </span>
          <span className="attendance-event-card__details">
            <strong>{event.name}</strong>
            <span>{event.registeredEvent.venue || 'Event Venue'}</span>
            <small>{getEventTimeDisplay(event.registeredEvent.dateTime)}</small>
          </span>
        </span>
      </Link>
    </article>
  );
=======
  useEffect(() => {
    const session = readAuthSession();
    if (!session?.token) {
      return;
    }
    const base =
      process.env.NEXT_PUBLIC_BACKEND_USER_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:4101";
    fetch(`${base}/api/attendance`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error || "Failed to load attendance records.");
        }
        setRecords(Array.isArray(json.attendance) ? json.attendance : []);
      })
      .catch((error) => setLoadingError(error instanceof Error ? error.message : "Failed to load attendance records."));
  }, []);

  const displayedRecords = useMemo<DisplayRow[]>(() => {
    if (records.length === 0) {
      return [];
    }
    return records.map((record) => ({
      name: String(record.eventTitle || "Event"),
      date: String(record.eventDate || "Date"),
      status: Number(record.attendedMinutes || 0) > 0 ? "Attended" : "Absent",
      certificate: Number(record.attendedMinutes || 0) > 0 ? "Eligible" : "Processing",
    }));
  }, [records]);
>>>>>>> backup/backend-user

  return (
    <>
      <div className="main__grid-wrap">
<<<<<<< HEAD
        <section className="attendance-shell" aria-label="My events attendance">
          <div className="attendance-top">
            <div>
              <h2 className="attendance-subtitle">Attendance <span>Overview</span></h2>
              <p>Check your attendance logs and participation progress in real time.</p>
            </div>
          </div>

          <section className="attendance-section" aria-label="Ongoing event attendance">
            <h2>Ongoing Attendance</h2>
            <div className="attendance-event-grid">
              {ongoingEvents.length ? ongoingEvents.map(renderAttendanceCard) : (
                <p className="completed-empty-message">No active events at the moment.</p>
              )}
            </div>
          </section>

          <section className="attendance-section" aria-label="Completed attendance">
            <h2>Completed Attendance</h2>
            {renderAttendanceFilters(
              'completed',
              completedFilter,
              completedDateRange,
              setCompletedFilter,
              setCompletedDateRange,
              getAttendanceDateKeys(completedEvents),
            )}
            <div className="attendance-event-grid">
              {filteredCompletedEvents.length ? filteredCompletedEvents.map(renderAttendanceCard) : (
                <p className="completed-empty-message">Completed attendance records will appear here.</p>
              )}
            </div>
          </section>

          <section className="attendance-section" aria-label="Incomplete attendance">
            <h2>Incomplete Attendance</h2>
            {renderAttendanceFilters(
              'incomplete',
              incompleteFilter,
              incompleteDateRange,
              setIncompleteFilter,
              setIncompleteDateRange,
              getAttendanceDateKeys(incompleteEvents),
            )}
            <div className="attendance-event-grid">
              {filteredIncompleteEvents.length ? filteredIncompleteEvents.map(renderAttendanceCard) : (
                <p className="completed-empty-message">Incomplete attendance records will appear here.</p>
              )}
            </div>
          </section>

        </section>
=======
        {displayedRecords.length > 0 ? (
          <section className="attendance-shell" aria-label="My events attendance">
            <div className="attendance-top">
              <h2 className="attendance-subtitle">My Events</h2>
            </div>

            <div className="table-wrap" aria-label="Attendance list">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th scope="col">Event Name</th>
                    <th scope="col">Date</th>
                    <th scope="col">Event Status</th>
                    <th scope="col">E-certificate</th>
                    <th scope="col" className="col-open" />
                  </tr>
                </thead>

                <tbody>
                  {displayedRecords.map((event) => (
                    <tr key={`${event.name}-${event.date}`}>
                      <td>{event.name}</td>
                      <td className="cell-muted">{event.date}</td>
                      <td className="cell-muted">{event.status}</td>
                      <td className="cert">{event.certificate}</td>
                      <td className="col-open">
                        <a href="/attendance/details" className="open-btn open-btn--ghost">
                          View Details
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M9 6l6 6-6 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="footer-controls" aria-label="Attendance filters">
              <div className="segmented" role="group" aria-label="Attendance controls">
                <button type="button">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h16M6 12h12M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Ascending
                </button>

                <button type="button">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M8 10l4-4 4 4M16 14l-4 4-4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Descending
                </button>
              </div>
            </div>
          </section>
        ) : (
          <EmptyState message="No attendance records found yet. Once you join an event, you can track your attendance here." />
        )}
        {loadingError && <p className="auth-field-error">{loadingError}</p>}
>>>>>>> backup/backend-user
      </div>
    </>
  );
}
