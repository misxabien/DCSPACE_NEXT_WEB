"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SearchWithClear } from "@/components/SearchWithClear";
import { readAuthSession } from "@/lib/user-api";

type DisplayRow = {
  name: string;
  date: string;
  status: string;
  certificate: string;
};

export function AttendancePageContent() {
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [loadingError, setLoadingError] = useState("");

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
