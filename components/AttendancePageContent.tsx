'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchWithClear } from "@/components/SearchWithClear";
import {
  ATTENDANCE_UPDATED_EVENT,
  REGISTERED_EVENTS_KEY,
  type AttendanceRecord,
  type EventStatus,
  type RegisteredEvent,
  getRequirementStatus,
  getCurrentAttendanceUser,
  getEventStatus,
  getRegisteredEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
  recordRfidAttendanceTap,
  setSelectedAttendanceEvent,
} from '@/lib/attendance';

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
  return Number.isNaN(eventDate.getTime()) ? null : eventDate;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
}

function getTapPairs(record?: AttendanceRecord) {
  return record?.taps?.length
    ? record.taps
    : record?.tapIn || record?.tapOut
      ? [{ tapIn: record.tapIn, tapOut: record.tapOut }]
      : [];
}

function getTimeMinutes(time?: string) {
  if (!time) return null;

  const parsed = new Date(`January 1, 2026 ${time}`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.getHours() * 60 + parsed.getMinutes();
}

function getTotalAttendanceMinutes(record?: AttendanceRecord) {
  return getTapPairs(record).reduce((total, pair) => {
    const tapIn = getTimeMinutes(pair.tapIn);
    const tapOut = getTimeMinutes(pair.tapOut);

    if (tapIn === null || tapOut === null) return total;
    return total + Math.max(0, tapOut - tapIn);
  }, 0);
}

function formatAttendanceDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getEventTimeDisplay(dateTime?: string) {
  return dateTime?.split(',').at(-1)?.trim() || 'Event Time';
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)
  );
}

export function AttendancePageContent() {
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const registeredEventsRef = useRef<RegisteredEvent[]>([]);
  const scanBufferRef = useRef('');
  const scanTimeoutRef = useRef<number | null>(null);

  const loadAttendanceEvents = useCallback(() => {
    const user = getCurrentAttendanceUser();
    const registeredEvents = readRegisteredEvents();
    const records = readUserAttendanceRecords(user);

    registeredEventsRef.current = registeredEvents;
    setAttendanceEvents(buildAttendanceEvents(registeredEvents, records));
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
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };

    updateClock();
    const timer = window.setInterval(updateClock, 30_000);

    return () => window.clearInterval(timer);
  }, []);

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

  const ongoingEvent = useMemo(
    () => sortedAttendanceEvents.find((event) => event.status === 'Ongoing'),
    [sortedAttendanceEvents],
  );
  const viewableEvent = ongoingEvent || sortedAttendanceEvents[0];
  const latestTotalAttendance = formatAttendanceDuration(getTotalAttendanceMinutes(ongoingEvent?.record));
  const summaryTapRows = [
    ...getTapPairs(ongoingEvent?.record).slice(-3).reverse(),
    ...Array.from({ length: Math.max(0, 3 - getTapPairs(ongoingEvent?.record).length) }, () => ({ tapIn: '', tapOut: '' })),
  ].slice(0, 3);
  const completedEvents = sortedAttendanceEvents.filter((event) => {
    const status = getRequirementStatus(event.record, event.registeredEvent);
    return status === 'Complete' || status === 'Overtime';
  });
  const filteredCompletedEvents = completedEvents.filter((event) => {
    const eventDate = getAttendanceEventDate(event);
    if (!eventDate) return attendanceFilter === 'All';

    if (attendanceFilter === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return isSameDate(eventDate, yesterday);
    }

    if (attendanceFilter === 'This Week') {
      return isThisWeek(eventDate);
    }

    if (attendanceFilter === 'Pick a date') {
      const eventDateValue = getDateInputValue(eventDate);
      const startsAfterStartDate = dateRange.start ? eventDateValue >= dateRange.start : true;
      const endsBeforeEndDate = dateRange.end ? eventDateValue <= dateRange.end : true;

      return startsAfterStartDate && endsBeforeEndDate;
    }

    return true;
  });

  const handleFilterClick = (filter: string) => {
    if (filter === 'Pick a date') {
      setAttendanceFilter('Pick a date');
      setShowDatePicker((current) => !current);
      return;
    }

    setAttendanceFilter(filter);
    setShowDatePicker(false);
  };

  const clearPickedDate = () => {
    setDateRange({ start: '', end: '' });
    setAttendanceFilter('All');
    setShowDatePicker(false);
  };

  return (
    <>
      <div className="main__grid-wrap">
        <section className="attendance-shell" aria-label="My events attendance">
          <div className="attendance-top">
            <div>
              <h2 className="attendance-subtitle">Attendance <span>Overview</span></h2>
              <p>Check your attendance logs and participation progress in real time.</p>
            </div>
            <SearchWithClear className="attendance-search" role="search" />
          </div>

          <section className="attendance-summary-card" aria-label="Ongoing event attendance summary">
            <header>
              <h3>Ongoing Event Attendance Summary</h3>
              <span>As of {currentTime || 'Recent Time'}</span>
              {viewableEvent ? (
                <Link href="/attendance/details" className="open-btn open-btn--ghost" onClick={() => setSelectedAttendanceEvent(viewableEvent.id)}>
                  View Event
                </Link>
              ) : (
                <button className="open-btn open-btn--ghost" type="button" disabled>
                  View Event
                </button>
              )}
            </header>
            <div className={`attendance-summary-grid${ongoingEvent ? '' : ' attendance-summary-grid--empty'}`}>
              <div>
                <span>Event Name</span>
                {ongoingEvent && (
                  <strong className="summary-event-name">{ongoingEvent?.name || 'Event Name'}</strong>
                )}
              </div>
              <div>
                <span>Tap In Time</span>
                {ongoingEvent && summaryTapRows.map((tap, index) => (
                  <strong key={`tap-in-${index}`}>{tap.tapIn || ''}</strong>
                ))}
              </div>
              <div>
                <span>Tap Out Time</span>
                {ongoingEvent && summaryTapRows.map((tap, index) => (
                  <strong key={`tap-out-${index}`}>{tap.tapOut || ''}</strong>
                ))}
              </div>
              <div>
                <span>Current Total Attendance Time</span>
                {ongoingEvent && <strong>{latestTotalAttendance}</strong>}
                {ongoingEvent && <strong />}
                {ongoingEvent && <strong />}
              </div>
              {!ongoingEvent && <p className="attendance-summary-empty">No Ongoing Event</p>}
            </div>
          </section>

          <section className="completed-attendance" aria-label="Completed event attendance">
            <div className="section-heading-row">
              <h2>Summary of <span>Event Attended</span></h2>
              <div className="segmented" role="group" aria-label="Attendance filters">
                {attendanceFilters.map((filter) => (
                  <span className="segmented-filter-wrap" key={filter}>
                    {filter === 'Pick a date' ? (
                      <>
                        <button
                          className={`segmented-date${attendanceFilter === filter ? ' is-active' : ''}${showDatePicker ? ' is-open' : ''}`}
                          type="button"
                          onClick={() => handleFilterClick(filter)}
                        >
                          <span>{filter}</span>
                        </button>
                        {showDatePicker && (
                          <section className="attendance-date-picker" aria-label="Choose attendance date">
                            <label>
                              <span>From</span>
                              <input
                                type="date"
                                value={dateRange.start}
                                onChange={(event) => {
                                  setDateRange((current) => ({ ...current, start: event.target.value }));
                                  setAttendanceFilter(filter);
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
                                  setAttendanceFilter(filter);
                                }}
                              />
                            </label>
                            <button className="attendance-date-picker__clear" type="button" onClick={clearPickedDate}>
                              Clear
                            </button>
                          </section>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={attendanceFilter === filter}
                        onClick={() => handleFilterClick(filter)}
                      >
                        {filter}
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="completed-event-grid">
              {filteredCompletedEvents.length > 0 ? (
                filteredCompletedEvents.map((event) => {
                const status = getRequirementStatus(event.record, event.registeredEvent);

                return (
                <Link
                  className="completed-event-card"
                  href="/attendance/details"
                  key={event.id}
                  onClick={() => setSelectedAttendanceEvent(event.id)}
                >
                  <div className="completed-event-card__date">
                    <span>{event.registeredEvent.month || 'MAY'}</span>
                    <strong>{event.registeredEvent.day || '17'}</strong>
                  </div>
                  <div>
                    <h3>{event.name}</h3>
                    <p>{event.registeredEvent.venue || 'Event Venue'}</p>
                    <small>{getEventTimeDisplay(event.registeredEvent.dateTime)}</small>
                    <small>{status === 'Complete' || status === 'Overtime' ? 'Attendance Completed' : 'Attendance Incomplete'}</small>
                  </div>
                </Link>
                );
              })
              ) : (
                <p className="completed-empty-message">You haven&apos;t completed any joined events yet.</p>
              )}
            </div>
          </section>

        </section>
      </div>
    </>
  );
}
