"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  getRegisteredEventId,
  getRequirementStatus,
  getSelectedAttendanceEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
} from "@/lib/attendance";

type AttendanceDetail = {
  event: RegisteredEvent;
  record?: AttendanceRecord;
  user: AttendanceUser;
};

const placeholderEvent: RegisteredEvent = {
  name: "Event Name",
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
  const [detail, setDetail] = useState<AttendanceDetail | null>(null);

  const refreshDetail = useCallback(() => {
    setDetail(readSelectedAttendanceDetail());
  }, []);

  useEffect(() => {
    refreshDetail();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === REGISTERED_EVENTS_KEY || event.key.startsWith("dcspaceAttendanceRecords:")) {
        refreshDetail();
      }
    };

    window.addEventListener("pageshow", refreshDetail);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);

    return () => {
      window.removeEventListener("pageshow", refreshDetail);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
    };
  }, [refreshDetail]);

  const event = detail?.event || placeholderEvent;
  const record = detail?.record;
  const user = detail?.user;
  const certificateStatus = getCertificateStatus(record);
  const tapRows = [
    {
      tapIn: record?.tapIn || "00-00 AM/PM",
      tapOut: record?.tapOut || "00-00 AM/PM",
    },
    ...Array.from({ length: 6 }, () => ({ tapIn: "", tapOut: "" })),
  ];

  const handleDownload = () => {
    if (!user) return;
    downloadAttendanceCertificate(event, user, record);
  };

  return (
    <div className="details-wrap">
      <div className="details-top">
        <div className="event-block">
          <h2 className="event-block__title">{event.name || "Event Name"}</h2>
          <p className="event-block__sub">Required Attendance Time:</p>
        </div>

        <Link href="/attendance" className="details-back">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 6L13 12L19 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Go Back
        </Link>
      </div>

      <section className="attendance-detail-summary" aria-label="Attendance details">
        <dl className="attendance-detail-list">
          <div>
            <dt>Date</dt>
            <dd>{formatEventDate(event)}</dd>
          </div>
          <div>
            <dt>Student No.</dt>
            <dd>{user?.studentNumber || "2025-0000"}</dd>
          </div>
          <div>
            <dt>Attendance Requirement Status</dt>
            <dd>{getRequirementStatus(record)}</dd>
          </div>
          <div>
            <dt>E-Certificate Status</dt>
            <dd>
              {certificateStatus === "Download" ? (
                <button className="cert-download" type="button" onClick={handleDownload}>
                  Download
                </button>
              ) : (
                certificateStatus
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="details-table-wrap details-table-wrap--desktop" aria-label="Attendance records">
        <table className="detail-table detail-table--desktop">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Student No.</th>
              <th scope="col">Tap IN</th>
              <th scope="col">Tap OUT</th>
              <th scope="col" className="col-status">
                Attendance<br />Requirement Status
              </th>
              <th scope="col" className="col-cert">
                E-Certificate<br />Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatEventDate(event)}</td>
              <td>{user?.studentNumber || "2025-0000"}</td>
              <td>{record?.tapIn || "00-00 AM/PM"}</td>
              <td>{record?.tapOut || "00-00 AM/PM"}</td>
              <td className="col-status">{getRequirementStatus(record)}</td>
              <td className="col-cert">
                {certificateStatus === "Download" ? (
                  <button className="cert-download" type="button" onClick={handleDownload}>
                    Download
                  </button>
                ) : (
                  certificateStatus
                )}
              </td>
            </tr>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr className="detail-empty-row" key={index}>
                <td colSpan={6} aria-hidden="true" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="details-table-wrap details-table-wrap--mobile" aria-label="Attendance records">
        <table className="detail-table detail-table--mobile">
          <thead>
            <tr>
              <th scope="col">Tap IN</th>
              <th scope="col">Tap OUT</th>
            </tr>
          </thead>
          <tbody>
            {tapRows.map((row, index) => (
              <tr className={index === 0 ? undefined : "detail-empty-row"} key={`${index}-${row.tapIn}-${row.tapOut}`}>
                <td>{row.tapIn}</td>
                <td>{row.tapOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
