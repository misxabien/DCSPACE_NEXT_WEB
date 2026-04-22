"use client";

import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { SearchWithClear } from "@/components/SearchWithClear";

const attendanceEvents = [
  {
    name: "Event Name",
    date: "Date",
    status: "Ongoing",
    certificate: "Processing",
  },
];

export function AttendancePageContent() {
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

          {attendanceEvents.length > 0 ? (
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
                  {attendanceEvents.map((event) => (
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
