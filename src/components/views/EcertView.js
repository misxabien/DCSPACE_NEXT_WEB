"use client";

import { useMemo, useState } from "react";
import { preAttendanceRows, postAttendanceRows } from "@/lib/ecertRows";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const ECERT_CARDS = [
  { name: "Digital Campus Ugnayan Seminar" },
  { name: "Digital Skills Bootcamp" },
  { name: "Student Research Colloquium" },
];

function EcertTableBody({ state, onDownload }) {
  const rows = state === "post" ? postAttendanceRows : preAttendanceRows;
  return (
    <>
      {rows.map((row, idx) => {
        const attendanceClass = row[5].toLowerCase();
        const certCell =
          row[6] === "Download" ? (
            <button
              className="btn-download"
              type="button"
              onClick={onDownload}
            >
              Download »
            </button>
          ) : (
            <span className="dash-placeholder">-</span>
          );
        return (
          <tr key={`${state}-${row[0]}-${idx}`}>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td>
              <span className="rfid-tag registered">{row[2]}</span>
            </td>
            <td>{row[3]}</td>
            <td>{row[4]}</td>
            <td>
              <span className={`attend-chip ${attendanceClass}`}>{row[5]}</span>
            </td>
            <td>{certCell}</td>
          </tr>
        );
      })}
    </>
  );
}

export function EcertView() {
  const showStatus = useShowStatus();
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [ecertState, setEcertState] = useState("pre");

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ECERT_CARDS.filter(
      (c) => !q || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section className="view" id="ecertView">
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
              <span>🔎</span>
              <input
                id="ecertSearch"
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const q = e.target.value.trim().toLowerCase();
                  const n = ECERT_CARDS.filter(
                    (c) => !q || c.name.toLowerCase().includes(q)
                  ).length;
                  showStatus(`${n} e-certificate event(s) shown`);
                }}
              />
            </label>
          </div>

          <div className="ecert-list" id="ecertList">
            {visibleCards.map((ev) => (
              <article
                key={ev.name}
                className="event-card"
                data-ecert-name={ev.name}
              >
                <div className="event-thumb">image placeholder</div>
                <div className="event-info">
                  <h3>Event Name</h3>
                  <p>Event Date and Time</p>
                  <p>Event Venue</p>
                  <p>Event Representative or Organizer</p>
                </div>
                <button
                  className="btn-view ecert-view-btn"
                  type="button"
                  onClick={() => {
                    setDetailOpen(true);
                    setEcertState("pre");
                    showStatus("Viewing pre-event attendance");
                  }}
                >
                  View Details »
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
            <div className="ecert-state-tabs">
              <button
                className={`ecert-state-tab${
                  ecertState === "pre" ? " active" : ""
                }`}
                type="button"
                data-ecert-state="pre"
                onClick={() => {
                  setEcertState("pre");
                  showStatus("Pre-event attendance");
                }}
              >
                Pre-Event Attendance
              </button>
              <button
                className={`ecert-state-tab${
                  ecertState === "post" ? " active" : ""
                }`}
                type="button"
                data-ecert-state="post"
                onClick={() => {
                  setEcertState("post");
                  showStatus("Post attendance");
                }}
              >
                Post Attendance
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

          <h2 className="event-title-strong">DIGITAL CAMPUS UGNAYAN SEMINAR</h2>
          <div className="ecert-meta-row">
            <div className="ecert-meta">
              <span>🗓 Date: April 15, 2026</span>
              <span>📍 Venue: DRA HALL</span>
              <span>👤 Requesting Organizer: Misxa Bien Germino</span>
              <span>⏰ Start Time: 1:00PM</span>
              <span>⌛ End Time: 5:00PM</span>
              <span>📄 Course: BSIT</span>
              <span>🏛 Organization: Domini Xode</span>
            </div>
            <button
              className="btn-sheets"
              type="button"
              id="viewInSheetsBtn"
              onClick={() => showStatus("Opening sheet view")}
            >
              View in Sheets
            </button>
          </div>

          <div className="ecert-table-wrap">
            <table className="ecert-table">
              <thead>
                <tr>
                  <th>Student Number</th>
                  <th>Date</th>
                  <th>Registration</th>
                  <th>TAP IN</th>
                  <th>TAP OUT</th>
                  <th>Attendance</th>
                  <th>E - Certificates</th>
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
        </div>
      </section>
    </section>
  );
}
