"use client";

import { useEffect, useMemo, useState } from "react";
import { preAttendanceRows, postAttendanceRows } from "@/lib/admin/ecertRows";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const ECERT_EVENTS = [
  {
    name: "Digital Campus Ugnayan Seminar",
    date: "April 15, 2026 · 1:00 PM – 5:00 PM",
    venue: "DRA Hall",
    organizer: "Misxa Bien Germino",
  },
  {
    name: "Digital Skills Bootcamp",
    date: "May 2, 2026 · 9:00 AM – 4:00 PM",
    venue: "Computer Lab 3",
    organizer: "Amira Marqueses",
  },
  {
    name: "Student Research Colloquium",
    date: "May 18, 2026 · 2:00 PM – 6:00 PM",
    venue: "Main Auditorium",
    organizer: "Paul Cielo",
  },
];

const EVENT_META = [
  { label: "Date", value: "April 15, 2026" },
  { label: "Venue", value: "DRA Hall" },
  { label: "Organizer", value: "Misxa Bien Germino" },
  { label: "Start time", value: "1:00 PM" },
  { label: "End time", value: "5:00 PM" },
  { label: "Course", value: "BSIT" },
  { label: "Organization", value: "Domini Xode" },
];

function EcertTableBody({ state, onDownload }) {
  const rows = state === "post" ? postAttendanceRows : preAttendanceRows;
  return (
    <>
      {rows.map((row, idx) => {
        const attendanceClass = row[5].toLowerCase();
        const certCell =
          row[6] === "Download" ? (
            <button className="btn-download" type="button" onClick={onDownload}>
              Download
            </button>
          ) : (
            <span className="dash-placeholder">—</span>
          );
        return (
          <tr key={`${state}-${row[0]}-${idx}`}>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td>
              <span className={`ecert-chip ecert-chip--registration ${row[2].toLowerCase()}`}>
                {row[2]}
              </span>
            </td>
            <td>{row[3]}</td>
            <td>{row[4]}</td>
            <td>
              <span className={`ecert-chip ecert-chip--attendance ${attendanceClass}`}>
                {row[5]}
              </span>
            </td>
            <td>{certCell}</td>
          </tr>
        );
      })}
    </>
  );
}

export function EcertView({ openAttendance = false }) {
  const showStatus = useShowStatus();
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [ecertState, setEcertState] = useState("pre");
  const [selectedEvent, setSelectedEvent] = useState(ECERT_EVENTS[0]);

  useEffect(() => {
    if (!openAttendance) return;
    setDetailOpen(true);
    setEcertState("post");
    showStatus("Post attendance records");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when opened from Events
  }, [openAttendance]);

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ECERT_EVENTS.filter((ev) => !q || ev.name.toLowerCase().includes(q));
  }, [query]);

  function openEvent(ev) {
    setSelectedEvent(ev);
    setDetailOpen(true);
    setEcertState("pre");
    showStatus("Viewing pre-event attendance");
  }

  return (
    <section className="view ecert-view" id="ecertView">
      <div className="header-row">
        <h1>E-Certificate and Attendance Management</h1>
      </div>

      <section className="ecert-wrap">
        <div
          className={`ecert-list-view${detailOpen ? " hidden" : ""}`}
          id="ecertListView"
        >
          <div className="ecert-search-row">
            <label className="search-wrap">
              <span aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M20 20l-3-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                id="ecertSearch"
                type="search"
                placeholder="Search events"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const q = e.target.value.trim().toLowerCase();
                  const n = ECERT_EVENTS.filter(
                    (ev) => !q || ev.name.toLowerCase().includes(q),
                  ).length;
                  showStatus(`${n} e-certificate event(s) shown`);
                }}
              />
            </label>
          </div>

          <div className="ecert-list" id="ecertList">
            {visibleCards.map((ev) => (
              <article key={ev.name} className="event-card" data-ecert-name={ev.name}>
                <div className="event-thumb">Image placeholder</div>
                <div className="event-info">
                  <h3>{ev.name}</h3>
                  <p>{ev.date}</p>
                  <p>{ev.venue}</p>
                  <p>{ev.organizer}</p>
                </div>
                <button
                  className="btn-view ecert-view-btn"
                  type="button"
                  onClick={() => openEvent(ev)}
                >
                  View details
                </button>
              </article>
            ))}
          </div>
        </div>

        <div
          className={`ecert-detail-view${detailOpen ? "" : " hidden"}`}
          id="ecertDetailView"
        >
          <div className="ecert-detail-head">
            <div className="ecert-state-tabs" role="tablist" aria-label="Attendance phase">
              <button
                className={`ecert-state-tab${ecertState === "pre" ? " active" : ""}`}
                type="button"
                role="tab"
                aria-selected={ecertState === "pre"}
                onClick={() => {
                  setEcertState("pre");
                  showStatus("Pre-event attendance");
                }}
              >
                Pre-event attendance
              </button>
              <button
                className={`ecert-state-tab${ecertState === "post" ? " active" : ""}`}
                type="button"
                role="tab"
                aria-selected={ecertState === "post"}
                onClick={() => {
                  setEcertState("post");
                  showStatus("Post attendance");
                }}
              >
                Post attendance
              </button>
            </div>
            <button
              className="btn-soft"
              id="backToEcertListBtn"
              type="button"
              onClick={() => {
                setDetailOpen(false);
                showStatus("Back to e-certificate list");
              }}
            >
              Back
            </button>
          </div>

          <article className="ecert-detail-card">
            <header className="ecert-detail-card__header">
              <p className="ecert-detail-card__eyebrow">Event attendance</p>
              <button
                className="btn-sheets"
                type="button"
                id="viewInSheetsBtn"
                onClick={() => showStatus("Opening sheet view")}
              >
                View in Sheets
              </button>
            </header>

            <h2 className="ecert-detail-card__title">{selectedEvent.name}</h2>

            <dl className="ecert-meta-grid">
              {EVENT_META.map((item) => (
                <div key={item.label} className="ecert-meta-field">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            <section className="ecert-table-section" aria-label="Attendee records">
              <div className="ecert-table-wrap">
                <table className="ecert-table">
                  <thead>
                    <tr>
                      <th scope="col">Student number</th>
                      <th scope="col">Date</th>
                      <th scope="col">Registration</th>
                      <th scope="col">Tap in</th>
                      <th scope="col">Tap out</th>
                      <th scope="col">Attendance</th>
                      <th scope="col">E-Certificate</th>
                    </tr>
                  </thead>
                  <tbody id="ecertTableBody">
                    <EcertTableBody
                      state={ecertState}
                      onDownload={() => showStatus("E-certificate downloaded")}
                    />
                  </tbody>
                </table>
              </div>
            </section>
          </article>
        </div>
      </section>
    </section>
  );
}
