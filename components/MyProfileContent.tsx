"use client";

import Link from "next/link";
import type { RegisteredEvent } from "@/lib/attendance";
import { useEffect, useMemo, useState } from "react";import {
  getCurrentAttendanceUser,
  readRegisteredEvents,
  readUserAttendanceRecords,
  getEventStatus,
  formatEventDate,
  getRegisteredEventId,
  getCertificateStatus,
  signOutAttendanceUser,
} from "@/lib/attendance";

export function MyProfileContent() {
  const [tab, setTab] = useState<"attended" | "organized" | "certs">("attended");
  const [sortAsc, setSortAsc] = useState(true);

  const [user, setUser] = useState<ReturnType<typeof getCurrentAttendanceUser> | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<ReturnType<typeof readRegisteredEvents>>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, ReturnType<typeof readUserAttendanceRecords>[string]>>({});

  useEffect(() => {
    const currentUser = getCurrentAttendanceUser();

    setUser(currentUser);
    setRegisteredEvents(readRegisteredEvents());
    setAttendanceRecords(readUserAttendanceRecords(currentUser));
  }, []);
  
  const attendedEvents = registeredEvents.filter((event) => {
    const eventId = getRegisteredEventId(event);
    return attendanceRecords[eventId];
  });

  const certificateEvents = attendedEvents.filter((event) => {
    const eventId = getRegisteredEventId(event);
    const record = attendanceRecords[eventId];
    return getCertificateStatus(record) === "Download";
  });

  const organizedEvents: RegisteredEvent[] = [];

  const visibleEvents = useMemo(() => {
    const events: typeof attendedEvents =
      tab === "attended"
        ? attendedEvents
        : tab === "certs"
        ? certificateEvents
        : organizedEvents;

    return [...events].sort((a, b) => {
      const dateA = formatEventDate(a);
      const dateB = formatEventDate(b);

      return sortAsc
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    });
  }, [tab, sortAsc, attendedEvents, certificateEvents, organizedEvents]);

  const initials =
    user?.studentEmail?.slice(0, 2).toUpperCase() ||
    user?.studentNumber?.slice(0, 2).toUpperCase() ||
    "DC";

  return (
    <div className="main--profile">
      <header className="profile-page-header">
        <h1 className="profile-page-header__title">My Profile</h1>

        <div className="profile-page-header__tools">
          <Link
            className="profile-logout"
            href="/login"
            onClick={() => {
              signOutAttendanceUser();
              window.sessionStorage.removeItem("dcspacePrivacySeen");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 2v10" />
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            </svg>
            Log out
          </Link>
        </div>
      </header>

      <div className="profile-page__inner">
        <div className="profile-hero-strip">
          <hr className="profile-hero-strip__rule" />
        </div>

        <section className="profile-summary" aria-labelledby="profile-summary-heading">
          <h2 id="profile-summary-heading" className="visually-hidden">
            Profile summary
          </h2>

          <div className="profile-summary__photo" aria-hidden>
            <span className="profile-summary__initials">{initials}</span>
          </div>

          <div className="profile-summary__fields">
            <p className="profile-summary__name">
              {user?.studentEmail || "Student Account"}
            </p>

            <p className="profile-summary__line">
              <span>Student Number:</span> {user?.studentNumber || "Not available"}
            </p>

            <p className="profile-summary__line">
              <span>Email:</span> {user?.studentEmail || "Not available"}
            </p>

            <p className="profile-summary__line">
              <span>RFID Number:</span> {user?.rfidNumber || "Not available"}
            </p>

            <p className="profile-summary__line">
              <span>Account Type:</span> Student
            </p>
          </div>
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Profile sections">
          <button
            type="button"
            className={`profile-tab${tab === "attended" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "attended"}
            onClick={() => setTab("attended")}
          >
            Events Attended ({attendedEvents.length})
          </button>

          <button
            type="button"
            className={`profile-tab${tab === "organized" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "organized"}
            onClick={() => setTab("organized")}
          >
            Events Organized ({organizedEvents.length})
          </button>

          <button
            type="button"
            className={`profile-tab${tab === "certs" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "certs"}
            onClick={() => setTab("certs")}
          >
            Certificates ({certificateEvents.length})
          </button>
        </div>

        <div className="profile-panel">
          <div className="profile-table-wrap">
            <table className="profile-table">
              <thead>
                <tr>
                  <th scope="col">Event Name</th>
                  <th scope="col">Date</th>
                  <th scope="col">Event Status</th>
                </tr>
              </thead>

              <tbody>
                {visibleEvents.length > 0 ? (
                  visibleEvents.map((event) => (
                    <tr key={getRegisteredEventId(event)}>
                      <td>{event.name || "Event Name"}</td>
                      <td>{formatEventDate(event)}</td>
                      <td>
                        <span className="profile-table__status">
                          {getEventStatus(event)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>
                      No records available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="profile-panel__footer">
            <div className="profile-sort" role="group" aria-label="Sort order">
              <button
                type="button"
                className={`profile-sort__btn${sortAsc ? " is-active" : ""}`}
                aria-pressed={sortAsc}
                onClick={() => setSortAsc(true)}
              >
                Ascending
              </button>

              <button
                type="button"
                className={`profile-sort__btn${!sortAsc ? " is-active" : ""}`}
                aria-pressed={!sortAsc}
                onClick={() => setSortAsc(false)}
              >
                Descending
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}