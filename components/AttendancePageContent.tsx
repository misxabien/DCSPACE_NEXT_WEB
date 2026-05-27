"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SearchWithClear } from "@/components/SearchWithClear";
import {
  ATTENDANCE_UPDATED_EVENT,
  formatEventDate,
  getCertificateStatus,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  getRequirementStatus,
  getSelectedAttendanceEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
  setSelectedAttendanceEvent,
  type RegisteredEvent,
  writeUserAttendanceRecords,
} from "@/lib/attendance";
import { fetchAttendanceLogs, readAuthSession } from "@/lib/user-api";
import type { AttendanceRecord } from "@/lib/attendance";

type DisplayRow = {
  name: string;
  date: string;
  status: string;
  certificate: string;
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

function buildFallbackEventFromRecord(record?: AttendanceRecord): RegisteredEvent | undefined {
  if (!record) return undefined;
  const parsedDate = new Date(String(record.eventDate || ""));
  const hasValidDate = !Number.isNaN(parsedDate.getTime());
  return {
    id: record.eventId,
    name: record.eventName || "Event",
    dateTime: record.eventDate || "",
    month: hasValidDate ? parsedDate.toLocaleString("en-US", { month: "long" }) : "",
    day: hasValidDate ? String(parsedDate.getDate()) : "",
    year: hasValidDate ? String(parsedDate.getFullYear()) : "",
  };
}

export function AttendancePageContent() {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [syncTick, setSyncTick] = useState(0);
  const [loadingError, setLoadingError] = useState('');

  useEffect(() => {
    const syncFromBackend = async () => {
      const session = readAuthSession();
      if (!session?.token) return;
      try {
        setLoadingError('');
        const response = await fetchAttendanceLogs(session.token);
        const user = getCurrentAttendanceUser();
        const registered = readRegisteredEvents();
        const registeredIds = new Set(registered.map((event) => getRegisteredEventId(event)));
        const localRecords = readUserAttendanceRecords(user);
        const nextRecords = { ...localRecords };
        for (const row of response.attendance || []) {
          const backendEventId = String(row.eventId || "").trim();
          if (!backendEventId) continue;
          const mappedEvent = registered.find((event) => {
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
      } catch (error) {
        setLoadingError(error instanceof Error ? error.message : 'Unable to sync attendance records.');
      }
    };

    const syncFromStorage = () => {
      const events = readRegisteredEvents();
      setRegisteredEvents(Array.isArray(events) ? events : []);
      const selected = getSelectedAttendanceEventId();
      if (selected) {
      } else if (events.length > 0) {
        const fallbackId = getRegisteredEventId(events[0]);
        setSelectedAttendanceEvent(fallbackId);
      }
    };

    void syncFromBackend().then(() => {
      syncFromStorage();
      setSyncTick((value) => value + 1);
    });
    syncFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "dcspaceRegisteredEvents" || event.key.startsWith("dcspaceAttendanceRecords:")) {
        syncFromStorage();
      }
    };

    const handlePageShow = () => {
      void syncFromBackend().then(() => {
        syncFromStorage();
        setSyncTick((value) => value + 1);
      });
    };
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", onStorage);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, syncFromStorage);
    const pollId = window.setInterval(() => {
      void syncFromBackend().then(() => {
        syncFromStorage();
        setSyncTick((value) => value + 1);
      });
    }, 2500);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  const displayedRecords = useMemo<DisplayRow[]>(() => {
    const user = getCurrentAttendanceUser();
    const records = readUserAttendanceRecords(user);
    const registeredEventIds = registeredEvents.map((event) => getRegisteredEventId(event));
    const recordOnlyEventIds = Object.keys(records).filter((eventId) => !registeredEventIds.includes(eventId));
    const allEventIds = [...registeredEventIds, ...recordOnlyEventIds];

    if (allEventIds.length === 0) {
      return [];
    }
    return allEventIds.map((eventId) => {
      const event = registeredEvents.find((value) => getRegisteredEventId(value) === eventId);
      const record = records[eventId];
      const eventForDisplay = event || buildFallbackEventFromRecord(record);
      return {
        eventId,
        name: eventForDisplay?.name || record?.eventName || "Event",
        date: eventForDisplay ? formatEventDate(eventForDisplay) : (record?.eventDate || "MM/DD/YYYY"),
        status: getRequirementStatus(record, eventForDisplay),
        certificate: getCertificateStatus(record, eventForDisplay),
      };
    });
  }, [registeredEvents, syncTick]);

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
          <SearchWithClear className="attendance-search" role="search" />
        </div>
      </header>

      <div className="main__grid-wrap">
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
      </div>
    </>
  );
}
