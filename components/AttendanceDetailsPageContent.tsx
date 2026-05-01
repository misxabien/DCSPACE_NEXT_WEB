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
  writeUserAttendanceRecords,
} from "@/lib/attendance";
import { fetchAttendanceLogs, readAuthSession } from "@/lib/user-api";

function getTimeMinutes(time?: string) {
  if (!time) return null;

  const date = new Date(`January 1, 2026 ${time}`);

  if (Number.isNaN(date.getTime())) return null;

  return date.getHours() * 60 + date.getMinutes();
}

function getTotalTimeLabel(record?: AttendanceRecord) {
  const pairs = record?.taps?.length
    ? record.taps
    : record?.tapIn || record?.tapOut
    ? [{ tapIn: record.tapIn, tapOut: record.tapOut }]
    : [];

  const totalMinutes = pairs.reduce((total, pair) => {
    const tapIn = getTimeMinutes(pair.tapIn);
    const tapOut = getTimeMinutes(pair.tapOut);

    if (tapIn === null || tapOut === null) return total;

    return total + Math.max(0, tapOut - tapIn);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} hr ${minutes} min`;
}

type AttendanceDetail = {
  event: RegisteredEvent;
  record?: AttendanceRecord;
  user: AttendanceUser;
};

const placeholderEvent: RegisteredEvent = {
  name: "Event Name",
};

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function mergeTapPairs(
  first: Array<{ tapIn?: string; tapOut?: string }>,
  second: Array<{ tapIn?: string; tapOut?: string }>,
) {
  const merged = [...first];
  const seen = new Set(merged.map((pair) => `${pair.tapIn || ""}|${pair.tapOut || ""}`));
  for (const pair of second) {
    const key = `${pair.tapIn || ""}|${pair.tapOut || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(pair);
  }
  return merged;
}

function buildEventFromAttendanceRecord(record?: AttendanceRecord): RegisteredEvent | null {
  if (!record) return null;
  const parsedDate = new Date(String(record.eventDate || ""));
  const hasValidDate = !Number.isNaN(parsedDate.getTime());
  return {
    id: record.eventId,
    name: record.eventName || "Event Name",
    dateTime: record.eventDate || "",
    month: hasValidDate ? parsedDate.toLocaleString("en-US", { month: "long" }) : "",
    day: hasValidDate ? String(parsedDate.getDate()) : "",
    year: hasValidDate ? String(parsedDate.getFullYear()) : "",
  };
}

function readSelectedAttendanceDetail(): AttendanceDetail {
  const user = getCurrentAttendanceUser();
  const registeredEvents = readRegisteredEvents();
  const selectedEventId = getSelectedAttendanceEventId();
  const records = readUserAttendanceRecords(user);
  const selectedRecord = selectedEventId ? records[selectedEventId] : undefined;

  const eventFromRegistered =
    registeredEvents.find((registeredEvent) => getRegisteredEventId(registeredEvent) === selectedEventId) ||
    registeredEvents[0] ||
    null;
  const event = eventFromRegistered || buildEventFromAttendanceRecord(selectedRecord) || placeholderEvent;

  const record = records[getRegisteredEventId(event)];

  return { event, record, user };
}

export function AttendanceDetailsPageContent() {
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const autoSubmitTimeoutRef = useRef<number | null>(null);
  const isProcessingTapRef = useRef(false);
  const lastProcessedTapRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const syncInFlightRef = useRef(false);

  const [rfidInput, setRfidInput] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [detail, setDetail] = useState<AttendanceDetail | null>(null);

  const refreshDetail = useCallback(() => {
    setDetail(readSelectedAttendanceDetail());
  }, []);

  const syncAttendanceFromBackend = useCallback(async () => {
    if (syncInFlightRef.current) return;
    const session = readAuthSession();
    if (!session?.token) return;

    syncInFlightRef.current = true;
    try {
      const response = await fetchAttendanceLogs(session.token);
      const user = getCurrentAttendanceUser();
      const localRecords = readUserAttendanceRecords(user);
      const nextRecords: Record<string, AttendanceRecord> = { ...localRecords };
      const registeredEvents = readRegisteredEvents();
      const registeredIds = new Set(registeredEvents.map((event) => getRegisteredEventId(event)));

      for (const row of response.attendance || []) {
        const backendEventId = String(row.eventId || "").trim();
        if (!backendEventId) continue;
        const mappedEvent = registeredEvents.find((event) => {
          const eventId = getRegisteredEventId(event);
          if (eventId === backendEventId) return true;
          const sameName = normalizeText(event.name) === normalizeText(row.eventName);
          const sameDate = normalizeText(formatEventDate(event)) === normalizeText(row.eventDate);
          return sameName && sameDate;
        });
        const targetEventId = mappedEvent
          ? getRegisteredEventId(mappedEvent)
          : registeredIds.has(backendEventId)
          ? backendEventId
          : backendEventId;
        const current = nextRecords[targetEventId];
        const mergedTaps = mergeTapPairs(
          Array.isArray(current?.taps) ? current.taps : [],
          Array.isArray(row.taps) ? row.taps : [],
        );
        const latestTapPair = mergedTaps[mergedTaps.length - 1] || {};
        nextRecords[targetEventId] = {
          eventId: targetEventId,
          eventName: String(row.eventName || ""),
          eventDate: String(row.eventDate || ""),
          studentNumber: String(row.studentNumber || user.studentNumber || ""),
          rfidNumber: String(row.rfidNumber || user.rfidNumber || ""),
          taps: mergedTaps,
          tapIn: latestTapPair.tapIn || row.tapIn || "",
          tapOut: latestTapPair.tapOut || row.tapOut || "",
          updatedAt: row.updatedAt || new Date().toISOString(),
        };
      }

      writeUserAttendanceRecords(user, nextRecords);
      refreshDetail();
    } catch {
      // Keep local fallback when backend is unavailable.
    } finally {
      syncInFlightRef.current = false;
    }
  }, [refreshDetail]);

  const focusScanner = useCallback(() => {
    window.setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    refreshDetail();
    void syncAttendanceFromBackend();
    focusScanner();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === REGISTERED_EVENTS_KEY || event.key.startsWith("dcspaceAttendanceRecords:")) {
        refreshDetail();
      }
    };

    const handlePageShowSync = () => {
      void syncAttendanceFromBackend();
    };

    window.addEventListener("pageshow", refreshDetail);
    window.addEventListener("pageshow", handlePageShowSync);
    window.addEventListener("pageshow", focusScanner);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
    window.addEventListener("click", focusScanner);
    const pollId = window.setInterval(() => {
      void syncAttendanceFromBackend();
    }, 2500);

    return () => {
      if (autoSubmitTimeoutRef.current) {
        window.clearTimeout(autoSubmitTimeoutRef.current);
      }
      window.clearInterval(pollId);
      window.removeEventListener("pageshow", refreshDetail);
      window.removeEventListener("pageshow", handlePageShowSync);
      window.removeEventListener("pageshow", focusScanner);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, refreshDetail);
      window.removeEventListener("click", focusScanner);
    };
  }, [refreshDetail, focusScanner, syncAttendanceFromBackend]);

  const event = detail?.event || placeholderEvent;
  const record = detail?.record;
  const user = detail?.user;

  const requirementStatus = getRequirementStatus(record, event);
  const certificateStatus = getCertificateStatus(record, event);
  const totalTimeLabel = getTotalTimeLabel(record);

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
    const normalized = scannedRfid.replace(/\s+/g, "").toLowerCase();
    const now = Date.now();
    const elapsedSinceLastTap = now - lastProcessedTapRef.current.at;
    // Prevent duplicate processing from scanner Enter + auto-submit firing together.
    if (lastProcessedTapRef.current.value === normalized && elapsedSinceLastTap < 1200) {
      return;
    }
    if (isProcessingTapRef.current) {
      return;
    }
    lastProcessedTapRef.current = { value: normalized, at: now };
    isProcessingTapRef.current = true;
    if (autoSubmitTimeoutRef.current) {
      window.clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }

    try {
      const registeredEvents = readRegisteredEvents();
      const result = await recordRfidAttendanceTap(scannedRfid, registeredEvents, getRegisteredEventId(event));

      setScanMessage(result.message === "No registered event found for attendance." ? "" : result.message);
      setRfidInput("");
      refreshDetail();
      focusScanner();
    } finally {
      isProcessingTapRef.current = false;
    }
  }, [event, focusScanner, refreshDetail]);

  const handleRfidSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    void processRfidTap(rfidInput);
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
            <dt>Total Attendance Time</dt>
            <dd>{totalTimeLabel}</dd>
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