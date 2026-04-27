"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SearchWithClear } from "@/components/SearchWithClear";
import { readAuthSession } from "@/lib/user-api";

export function AttendancePageContent() {
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [loadingError, setLoadingError] = useState("");

  useEffect(() => {
    const session = readAuthSession();
    if (!session?.token) {
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_USER_API_URL || "http://127.0.0.1:4001"}/api/attendance`, {
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

  const displayedRecords = useMemo(() => {
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
        <section className="attendance-shell" aria-label="My events attendance">
          <div className="attendance-top">
            <h2 className="attendance-subtitle">My Events</h2>
          </div>

          {displayedRecords.length > 0 ? (
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
                        <Link href="/attendance/details" className="open-btn open-btn--ghost">
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
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr className="attendance-empty-row" key={index}>
                      <td colSpan={5} aria-hidden="true" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No attendance records found yet. Once you join an event, you can track your attendance here." />
          )}
          {loadingError && <p className="auth-field-error">{loadingError}</p>}

          <div className="footer-controls" aria-label="Attendance filters">
            <div className="segmented" role="group" aria-label="Attendance controls">
              <button type="button">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M6 12h12M8 17h8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
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
      </div>
    </>
  );
}
