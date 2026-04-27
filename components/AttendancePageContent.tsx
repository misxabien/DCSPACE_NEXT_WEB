"use client";

import { useEffect, useState } from "react";
import { SearchWithClear } from "@/components/SearchWithClear";

type AttendanceEvent = {
  name: string;
  date: string;
  status: string;
  certificate: string;
};

type RegisteredEvent = {
  month: string;
  day: string;
  year: string;
  name: string;
  status: string;
  certificate: string;
};

export function AttendancePageContent() {
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dcspaceRegisteredEvents") || "[]") as RegisteredEvent[];

    const formatted = saved.map((event) => ({
      name: event.name,
      date: `${event.month} ${event.day}, ${event.year}`,
      status: event.status,
      certificate: event.certificate,
    }));

    setAttendanceEvents(formatted);
  }, []);

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
          <SearchWithClear className="attendance-search" role="search" />
        </div>
      </header>

      <div className="main__grid-wrap">
        {attendanceEvents.length > 0 ? (
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
                  {attendanceEvents.map((event) => (
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
                    <path d="M8 10l4-4 4 4M16 14l-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Descending
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="attendance-empty-state" aria-label="No attendance records">
            <svg width="82" height="76" viewBox="0 0 82 76" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M30.7499 12.667H18.7916C17.8481 12.667 17.0833 13.3759 17.0833 14.2503V68.0837C17.0833 68.958 17.8481 69.667 18.7916 69.667H66.6249C67.5683 69.667 68.3333 68.958 68.3333 68.0837V14.2503C68.3333 13.3759 67.5683 12.667 66.6249 12.667H54.6666" stroke="#604D18" strokeWidth="2" />
              <path d="M30.75 20.5833V12.6667H37.4989C37.5454 12.6667 37.5833 12.6316 37.5833 12.5883V9.5C37.5833 6.87667 39.8776 4.75 42.7083 4.75C45.539 4.75 47.8333 6.87667 47.8333 9.5V12.5883C47.8333 12.6316 47.8713 12.6667 47.9177 12.6667H54.6667V20.5833C54.6667 21.4578 53.9017 22.1667 52.9583 22.1667H32.4583C31.5148 22.1667 30.75 21.4578 30.75 20.5833Z" stroke="#604D18" strokeWidth="2" />
            </svg>

            <p>
              No attendance records found yet. Once you join an
              <br />
              event, you can track your attendance here.
            </p>
          </section>
        )}
      </div>
    </>
  );
}