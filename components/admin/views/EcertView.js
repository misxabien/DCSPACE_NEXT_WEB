"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { preAttendanceRows, postAttendanceRows } from "@/lib/admin/ecertRows";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const MOCK_EVENTS = [
  {
    id: "mock-digital-campus-ugnayan",
    isMock: true,
    title: "Digital Campus Ugnayan Seminar",
    date: "April 15, 2026",
    time: "1:00 PM - 5:00 PM",
    venue: "DRA Hall",
    organizer: "Misxa Bien Germino",
    startTime: "1:00 PM",
    endTime: "5:00 PM",
    course: "BSIT",
    organization: "Domini Xode",
  },
  {
    id: "mock-digital-skills-bootcamp",
    isMock: true,
    title: "Digital Skills Bootcamp",
    date: "May 2, 2026",
    time: "9:00 AM - 4:00 PM",
    venue: "Computer Lab 3",
    organizer: "Amira Marqueses",
    startTime: "9:00 AM",
    endTime: "4:00 PM",
    course: "BSIT",
    organization: "Domini Xode",
  },
  {
    id: "mock-student-research-colloquium",
    isMock: true,
    title: "Student Research Colloquium",
    date: "May 18, 2026",
    time: "2:00 PM - 6:00 PM",
    venue: "Main Auditorium",
    organizer: "Paul Cielo",
    startTime: "2:00 PM",
    endTime: "6:00 PM",
    course: "BSIT",
    organization: "Domini Xode",
  },
];

function buildMockRows(state) {
  const sourceRows = state === "post" ? postAttendanceRows : preAttendanceRows;

  return sourceRows.map((row) => ({
    isMock: true,
    id: row[0],
    userId: row[0],
    status: row[2],
    tapIn: row[3] === "00:00" ? "" : row[3],
    tapOut: row[4] === "00:00" ? "" : row[4],
    attendanceStatus: row[5],
    canGenerate: row[6] === "Download",
    canDownload: row[6] === "Download",
  }));
}

function getEventTitle(event) {
  return event?.title ?? event?.name ?? "Untitled event";
}

function getErrorMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

function normalizeChipClass(value) {
  return String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");
}

function buildMeta(selectedEvent, selectedEventDetail) {
  const event = selectedEventDetail ?? selectedEvent ?? {};

  return [
    { label: "Date", value: event.date ?? "TBA" },
    { label: "Venue", value: event.venue ?? "TBA" },
    { label: "Organizer", value: event.organizer ?? "Unknown organizer" },
    { label: "Start time", value: event.startTime ?? event.time ?? "TBA" },
    { label: "End time", value: event.endTime ?? "TBA" },
    { label: "Course", value: event.course ?? "N/A" },
    { label: "Organization", value: event.organization ?? "N/A" },
  ];
}

function EcertTableBody({ rows, selectedEvent, selectedEventDetail, loading, onDownload }) {
  if (loading) {
    return (
      <tr>
        <td colSpan={7}>Loading attendance records...</td>
      </tr>
    );
  }

  if (!rows.length) {
    return (
      <tr>
        <td colSpan={7}>No attendance records found.</td>
      </tr>
    );
  }

  const eventDate = selectedEventDetail?.date ?? selectedEvent?.date ?? "N/A";

  return (
    <>
      {rows.map((row, idx) => {
        const attendanceStatus = row.attendanceStatus ?? "Pending";
        const registrationStatus = row.status ?? "Not Registered";
        const canDownload = row.canGenerate || row.canDownload;

        return (
          <tr key={`${row.userId ?? row.attendeeId ?? row.id}-${idx}`}>
            <td>{row.id ?? row.studentNumber ?? "N/A"}</td>
            <td>{eventDate}</td>
            <td>
              <span
                className={`ecert-chip ecert-chip--registration ${normalizeChipClass(
                  registrationStatus,
                )}`}
              >
                {registrationStatus}
              </span>
            </td>
            <td>{row.tapIn || <span className="dash-placeholder">-</span>}</td>
            <td>{row.tapOut || <span className="dash-placeholder">-</span>}</td>
            <td>
              <span
                className={`ecert-chip ecert-chip--attendance ${normalizeChipClass(
                  attendanceStatus,
                )}`}
              >
                {attendanceStatus}
              </span>
            </td>
            <td>
              {canDownload ? (
                <button
                  className="btn-download"
                  type="button"
                  onClick={() => onDownload(row)}
                >
                  Download
                </button>
              ) : (
                <span className="dash-placeholder">-</span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function EcertView({ openAttendance = false }) {
  const showStatus = useShowStatus();
  const templateInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [ecertState, setEcertState] = useState("pre");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [error, setError] = useState("");

  async function loadEvents() {
    setEventsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/events?status=approved&limit=100");
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to load events"));
      }

      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load events";
      setError(message);
      showStatus(message);
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadAttendees(eventId) {
    if (!eventId) return;

    setRowsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/certificates?eventId=${encodeURIComponent(eventId)}`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to load attendance records"));
      }

      setSelectedEventDetail(data?.event ?? null);
      setAttendees(Array.isArray(data?.attendees) ? data.attendees : []);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load attendance records";
      setSelectedEventDetail(null);
      setAttendees([]);
      setError(message);
      showStatus(message);
    } finally {
      setRowsLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial admin data load
  }, []);

  useEffect(() => {
    if (!openAttendance || detailOpen) return;

    const firstEvent = events[0] ?? MOCK_EVENTS[0];
    setSelectedEvent(firstEvent);
    setDetailOpen(true);
    setEcertState("post");
    if (firstEvent.isMock) {
      setSelectedEventDetail(firstEvent);
      setAttendees(buildMockRows("post"));
    } else {
      loadAttendees(firstEvent.id);
    }
    showStatus("Post attendance records");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- opened from Events shortcut
  }, [openAttendance, detailOpen, events]);

  const displayEvents = events.length > 0 ? events : MOCK_EVENTS;

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return displayEvents.filter((ev) => !q || getEventTitle(ev).toLowerCase().includes(q));
  }, [displayEvents, query]);

  const metaItems = useMemo(
    () => buildMeta(selectedEvent, selectedEventDetail),
    [selectedEvent, selectedEventDetail],
  );

  function openEvent(ev) {
    setSelectedEvent(ev);
    setSelectedEventDetail(null);
    setAttendees([]);
    setDetailOpen(true);
    setEcertState("pre");
    if (ev.isMock) {
      setSelectedEventDetail(ev);
      setAttendees(buildMockRows("pre"));
    } else {
      loadAttendees(ev.id);
    }
    showStatus("Viewing event attendance");
  }

  async function downloadCertificate(row) {
    if (row.isMock) {
      showStatus("Sample e-certificate downloaded");
      return;
    }

    if (!selectedEvent?.id || !row.userId) {
      showStatus("Missing event or user data");
      return;
    }

    try {
      showStatus("Generating e-certificate");
      const response = await fetch("/api/admin/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, userId: row.userId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, "Unable to generate certificate"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${row.id ?? row.userId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setAttendees((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.userId === row.userId
            ? { ...currentRow, certificateStatus: "issued", canDownload: true }
            : currentRow,
        ),
      );
      showStatus("E-certificate downloaded");
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : "Unable to generate certificate";
      showStatus(message);
    }
  }

  async function uploadTemplate(file) {
    if (selectedEvent?.isMock) {
      showStatus("Template upload needs a real event");
      return;
    }

    if (!selectedEvent?.id || !file) return;

    const formData = new FormData();
    formData.append("eventId", selectedEvent.id);
    formData.append("template", file);

    try {
      showStatus("Uploading certificate template");
      const response = await fetch("/api/admin/certificates/template", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to upload template"));
      }

      showStatus("Certificate template uploaded");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Unable to upload template";
      showStatus(message);
    } finally {
      if (templateInputRef.current) {
        templateInputRef.current.value = "";
      }
    }
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
                  const n = displayEvents.filter(
                    (ev) => !q || getEventTitle(ev).toLowerCase().includes(q),
                  ).length;
                  showStatus(`${n} e-certificate event(s) shown`);
                }}
              />
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="ecert-list" id="ecertList">
            {eventsLoading ? <p>Loading events...</p> : null}

            {!eventsLoading && events.length === 0 ? <p>Showing sample e-certificate data.</p> : null}
            {!eventsLoading && visibleCards.length === 0 ? <p>No e-certificate events found.</p> : null}

            {visibleCards.map((ev) => (
              <article key={ev.id} className="event-card" data-ecert-name={getEventTitle(ev)}>
                <div className="event-thumb">
                  {ev.pubmatImage ? (
                    <img src={ev.pubmatImage} alt="" />
                  ) : (
                    "Image placeholder"
                  )}
                </div>
                <div className="event-info">
                  <h3>{getEventTitle(ev)}</h3>
                  <p>{ev.date ?? "TBA"}</p>
                  <p>{ev.venue ?? "TBA"}</p>
                  <p>{ev.organizer ?? "Unknown organizer"}</p>
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
                  if (selectedEvent?.isMock) {
                    setAttendees(buildMockRows("pre"));
                  }
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
                  if (selectedEvent?.isMock) {
                    setAttendees(buildMockRows("post"));
                  }
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
              <div>
                <input
                  ref={templateInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(event) => uploadTemplate(event.target.files?.[0])}
                />
                <button
                  className="btn-soft"
                  type="button"
                  onClick={() => templateInputRef.current?.click()}
                >
                  Upload template
                </button>
                <button
                  className="btn-sheets"
                  type="button"
                  id="viewInSheetsBtn"
                  onClick={() => showStatus("No sheet link available")}
                >
                  View in Sheets
                </button>
              </div>
            </header>

            <h2 className="ecert-detail-card__title">
              {getEventTitle(selectedEventDetail ?? selectedEvent)}
            </h2>

            {error ? <p className="form-error">{error}</p> : null}

            <dl className="ecert-meta-grid">
              {metaItems.map((item) => (
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
                      rows={attendees}
                      selectedEvent={selectedEvent}
                      selectedEventDetail={selectedEventDetail}
                      loading={rowsLoading}
                      onDownload={downloadCertificate}
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
