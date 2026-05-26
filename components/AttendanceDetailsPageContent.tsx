'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ATTENDANCE_UPDATED_EVENT,
  REGISTERED_EVENTS_KEY,
  type AttendanceRecord,
  type AttendanceUser,
  type RegisteredEvent,
  downloadAttendanceCertificate,
  formatEventDate,
  getCertificateStatus,
  getCurrentAttendanceUser,
  getEventStatus,
  getRegisteredEventId,
  getSelectedAttendanceEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
  recordRfidAttendanceTap,
} from '@/lib/attendance';

function getTimeMinutes(time?: string) {
  if (!time) return null;

  const date = new Date(`January 1, 2026 ${time}`);

  if (Number.isNaN(date.getTime())) return null;

  return date.getHours() * 60 + date.getMinutes();
}

function getTapPairs(record?: AttendanceRecord) {
  return record?.taps?.length
    ? record.taps
    : record?.tapIn || record?.tapOut
      ? [{ tapIn: record.tapIn, tapOut: record.tapOut }]
      : [];
}

function getEventTimeDisplay(dateTime?: string) {
  return dateTime?.split(',').at(-1)?.trim() || 'Event Time';
}

function getProgressPercent(record?: AttendanceRecord, event?: RegisteredEvent) {
  const totalMinutes = getTapPairs(record).reduce((total, pair) => {
    const tapIn = getTimeMinutes(pair.tapIn);
    const tapOut = getTimeMinutes(pair.tapOut);

    if (tapIn === null || tapOut === null) return total;
    return total + Math.max(0, tapOut - tapIn);
  }, 0);
  const requiredMinutes = Number(event?.minAttendance?.match(/\d+(\.\d+)?/)?.[0] || 0);

  if (!requiredMinutes) return record?.tapIn ? 35 : 0;
  return Math.min(100, Math.round((totalMinutes / requiredMinutes) * 100));
}

const eventDetailIconBase = '/svg icons organized events page/svg icons create event form page';
const eventDetailIcons = {
  date: `${eventDetailIconBase}/event-date-icon.svg`,
  time: `${eventDetailIconBase}/clock-fill-icon.svg`,
  venue: `${eventDetailIconBase}/location-icon.svg`,
  requirement: `${eventDetailIconBase}/clock-fill-icon.svg`,
  grace: `${eventDetailIconBase}/grace-period-icon.svg`,
};

function DetailIcon({ type }: { type: keyof typeof eventDetailIcons }) {
  return <img src={eventDetailIcons[type]} alt="" aria-hidden="true" />;
}

type AttendanceDetail = {
  event: RegisteredEvent;
  record?: AttendanceRecord;
  user: AttendanceUser;
};

const placeholderEvent: RegisteredEvent = {
  name: 'Event Name',
};

function readSelectedAttendanceDetail(): AttendanceDetail {
  const user = getCurrentAttendanceUser();
  const registeredEvents = readRegisteredEvents();
  const selectedEventId = getSelectedAttendanceEventId();

  const event =
    registeredEvents.find((registeredEvent) => getRegisteredEventId(registeredEvent) === selectedEventId) ||
    registeredEvents[0] ||
    placeholderEvent;

  const records = readUserAttendanceRecords(user);
  const record = records[getRegisteredEventId(event)];

  return { event, record, user };
}

export function AttendanceDetailsPageContent() {
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const [rfidInput, setRfidInput] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [detail, setDetail] = useState<AttendanceDetail | null>(null);

  const refreshDetail = useCallback(() => {
    setDetail(readSelectedAttendanceDetail());
  }, []);

  const focusScanner = useCallback(() => {
    window.setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    refreshDetail();
    focusScanner();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === REGISTERED_EVENTS_KEY || event.key.startsWith('dcspaceAttendanceRecords:')) {
        refreshDetail();
      }
    };

    window.addEventListener('pageshow', refreshDetail);
    window.addEventListener('pageshow', focusScanner);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
    window.addEventListener('click', focusScanner);

    return () => {
      window.removeEventListener('pageshow', refreshDetail);
      window.removeEventListener('pageshow', focusScanner);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
      window.removeEventListener('click', focusScanner);
    };
  }, [refreshDetail, focusScanner]);

  const event = detail?.event || placeholderEvent;
  const record = detail?.record;
  const user = detail?.user;
  const progressPercent = getProgressPercent(record, event);
  const isPassedEvent = getEventStatus(event) === 'Passed';
  const certificateStatus = getCertificateStatus(record, event);

  const savedTapRows = getTapPairs(record);
  const tapRows = [
    ...(savedTapRows.length ? [...savedTapRows].reverse() : [{ tapIn: '00:00', tapOut: '00:00' }]),
    ...Array.from({ length: Math.max(0, 4 - Math.max(1, savedTapRows.length)) }, () => ({
      tapIn: '',
      tapOut: '',
    })),
  ];

  const handleRfidSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const scannedRfid = rfidInput.trim();

    if (!scannedRfid) {
      focusScanner();
      return;
    }

    const registeredEvents = readRegisteredEvents();
    const result = recordRfidAttendanceTap(scannedRfid, registeredEvents);

    setScanMessage(result.message);
    setRfidInput('');
    refreshDetail();
    focusScanner();
  };

  const handleCertificateDownload = () => {
    if (!user || certificateStatus !== 'Download') return;

    downloadAttendanceCertificate(event, user, record);
  };

  return (
    <div className="details-wrap">
      <form className="rfid-hidden-form" onSubmit={handleRfidSubmit}>
        <input
          ref={scannerInputRef}
          className="rfid-hidden-input"
          type="text"
          value={rfidInput}
          onChange={(inputEvent) => setRfidInput(inputEvent.target.value)}
          autoComplete="off"
          aria-label="RFID scanner input"
        />
      </form>

      <div className="details-top">
        <div>
          <h2 className="details-heading">Real-Time <span>Attendance Logs</span></h2>
          <h3>Event Details</h3>
        </div>
        {isPassedEvent && (
          <aside className="attendance-certificate-actions" aria-label="Certificate status">
            {certificateStatus === 'Download' ? (
              <button className="attendance-certificate-button is-received" type="button" onClick={handleCertificateDownload}>
                Download Certificate
              </button>
            ) : (
              <button className="attendance-certificate-button is-missing" type="button">
                You didn&apos;t receive a certificate for this event
              </button>
            )}
          </aside>
        )}
      </div>

      <section className={`attendance-detail-card${isPassedEvent ? ' attendance-detail-card--passed' : ''}`} aria-label="Event details">
        <div className="attendance-detail-card__main">
          <h2>{event.name || 'Event Name'}</h2>
          {isPassedEvent && <p className="attendance-passed-note">This event has passed.</p>}
          <dl>
            <div>
              <DetailIcon type="date" />
              <dt>Event Date</dt>
              <dd>{formatEventDate(event)}</dd>
            </div>
            <div>
              <DetailIcon type="time" />
              <dt>Event Time</dt>
              <dd>{getEventTimeDisplay(event.dateTime)}</dd>
            </div>
            <div>
              <DetailIcon type="venue" />
              <dt>Event Venue</dt>
              <dd>{event.venue || 'Event Venue'}</dd>
            </div>
            <div>
              <DetailIcon type="requirement" />
              <dt>Attendance Time Requirement</dt>
              <dd>{event.minAttendance || 'TBA'}</dd>
            </div>
            <div>
              <DetailIcon type="grace" />
              <dt>Allowed Grace Period</dt>
              <dd>{event.duration || 'TBA'}</dd>
            </div>
          </dl>
          {scanMessage && <p className="rfid-scan-message">{scanMessage}</p>}
        </div>
      </section>

      <section className="rfid-activity" aria-label="RFID activity logs">
        <h2>RFID Activity Logs</h2>
        <div className="rfid-activity-card">
          <div className="rfid-activity-card__head">
            <h3>Tap IN</h3>
            <h3>Tap OUT</h3>
          </div>
          <div className="attendance-progress">
            <p>Attendance Progress: <strong>{progressPercent}%</strong></p>
            <span><i style={{ width: `${progressPercent}%` }} /></span>
            <small>Complete the attendance requirement to receive your certificate.</small>
          </div>
          <div className="rfid-activity-rows">
            {tapRows.map((row, index) => (
              <div className="rfid-activity-row" key={`${index}-${row.tapIn}-${row.tapOut}`}>
                <span>{row.tapIn || '00:00'}</span>
                <span>{row.tapOut || '00:00'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
