"use client";

import Link from "next/link";
import { SearchWithClear } from "@/components/SearchWithClear";

export function AttendancePageContent() {
  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Layout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button type="button" className="main__tool" aria-label="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <div className="main__grid-wrap">
        <section className="attendance-shell" aria-label="My events attendance">
          <div className="attendance-top">
            <h2 className="attendance-subtitle">My Events</h2>
            <SearchWithClear role="search" />
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
                <tr>
                  <td>Event Name</td>
                  <td className="cell-muted">Date</td>
                  <td className="cell-muted">Ongoing</td>
                  <td className="cert">Pending</td>
                  <td className="col-open">
                    <Link href="/attendance/details" className="open-btn open-btn--ghost">
                      Open
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
                <tr>
                  <td>Event Name</td>
                  <td className="cell-muted">Date</td>
                  <td className="cell-muted">Ongoing</td>
                  <td className="cert">Upcoming</td>
                  <td className="col-open">
                    <Link href="/attendance/details" className="open-btn open-btn--primary">
                      Open
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
              </tbody>
            </table>
          </div>

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
                Attending
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
