'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function getEventTimeDisplay(dateTime?: string) {
  return dateTime?.split(',').at(-1)?.trim() || 'Event Time';
}

function getEventBanner(event: RegisteredEvent) {
  return (event as RegisteredEvent & { bannerDataUrl?: string }).bannerDataUrl || '';
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

  return (
    <>
      <div className="main__grid-wrap">
        <section className="attendance-shell" aria-label="My events attendance">
          <div className="attendance-top">
            <div>
              <h2 className="attendance-subtitle">Attendance <span>Overview</span></h2>
              <p>Check your attendance logs and participation progress in real time.</p>
            </div>
          </div>

          <section className="attendance-section" aria-label="Ongoing event attendance">
            <h2>Ongoing Event Attendance</h2>
            <div className="attendance-event-grid">
              {ongoingEvents.length ? ongoingEvents.map(renderAttendanceCard) : (
                <p className="completed-empty-message">No active events at the moment.</p>
              )}
            </div>
          </section>

          <section className="attendance-section" aria-label="Completed attendance">
            <h2>Attendance Completed</h2>
            <div className="attendance-event-grid">
              {completedEvents.length ? completedEvents.map(renderAttendanceCard) : (
                <p className="completed-empty-message">Completed attendance records will appear here.</p>
              )}
            </div>
          </section>

          <section className="attendance-section" aria-label="Incomplete attendance">
            <h2>Incomplete Attendance</h2>
            <div className="attendance-event-grid">
              {incompleteEvents.length ? incompleteEvents.map(renderAttendanceCard) : (
                <p className="completed-empty-message">Incomplete attendance records will appear here.</p>
              )}
            </div>
          </section>

        </section>
      </div>
    </>
  );
}
