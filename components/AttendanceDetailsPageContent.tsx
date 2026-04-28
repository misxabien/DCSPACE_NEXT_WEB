"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  recordRfidAttendanceTap,
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
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const [rfidInput, setRfidInput] = useState("");
  const [scanMessage, setScanMessage] = useState("");
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
      if (!event.key || event.key === REGISTERED_EVENTS_KEY || event.key.startsWith("dcspaceAttendanceRecords:")) {
        refreshDetail();
      }
    };

    window.addEventListener("pageshow", refreshDetail);
    window.addEventListener("pageshow", focusScanner);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
    window.addEventListener("click", focusScanner);

    return () => {
      window.removeEventListener("pageshow", refreshDetail);
      window.removeEventListener("pageshow", focusScanner);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
      window.removeEventListener("click", focusScanner);
    };
  }, [refreshDetail, focusScanner]);

  const event = detail?.event || placeholderEvent;
  const record = detail?.record;
  const user = detail?.user;

  const requirementStatus = getRequirementStatus(record, event);
  const certificateStatus = getCertificateStatus(record, event);

  const savedTapRows =
    record?.taps?.length
      ? record.taps
      : record?.tapIn || record?.tapOut
      ? [{ tapIn: record.tapIn, tapOut: record.tapOut }]
      : [{ tapIn: "00-00 AM/PM", tapOut: "00-00 AM/PM" }];

  const tapRows = [
    ...savedTapRows,
    ...Array.from({ length: Math.max(0, 7 - savedTapRows.length) }, () => ({
      tapIn: "",
      tapOut: "",
    })),
  ];

  const handleDownload = () => {
    if (!user) return;
    downloadAttendanceCertificate(event, user, record);
  };

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
    setRfidInput("");
    refreshDetail();
    focusScanner();
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
        <div className="event-block">
          <h2 className="event-block__title">{event.name || "Event Name"}</h2>

          <p className="event-block__sub">
            Required Attendance Time: {event.minAttendance || "TBA"}
          </p>

          {scanMessage && <p className="rfid-scan-message">{scanMessage}</p>}
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
            <dd>{requirementStatus}</dd>
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
            {savedTapRows.map((tap, index) => (
              <tr key={`${index}-${tap.tapIn}-${tap.tapOut}`}>
                <td>{index === 0 ? formatEventDate(event) : ""}</td>
                <td>{index === 0 ? user?.studentNumber || "2025-0000" : ""}</td>
                <td>{tap.tapIn || ""}</td>
                <td>{tap.tapOut || ""}</td>
                <td className="col-status">{index === 0 ? requirementStatus : ""}</td>
                <td className="col-cert">
                  {index === 0 ? (
                    certificateStatus === "Download" ? (
                      <button className="cert-download" type="button" onClick={handleDownload}>
                        Download
                      </button>
                    ) : (
                      certificateStatus
                    )
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))}

            {Array.from({ length: Math.max(0, 5 - savedTapRows.length) }).map((_, index) => (
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