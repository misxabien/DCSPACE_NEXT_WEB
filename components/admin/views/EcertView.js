"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

function buildDetailFields(event) {
  if (!event) return [];
  return [
    { label: "Date", value: event.dateLabel || event.date || "—" },
    { label: "Venue", value: event.venue || "—" },
    { label: "Organizer", value: event.organizer || "—" },
    { label: "Start time", value: event.startTime || "—" },
    { label: "End time", value: event.endTime || "—" },
    { label: "Course", value: event.course || "—" },
    { label: "Organization", value: event.organization || "—" },
    { label: "Minimum attendance", value: event.minAttendance || "—" },
  ];
}

function attendanceChipClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "incomplete") return "incomplete";
  if (normalized === "undertime") return "incomplete";
  return "pending";
}

function EcertTableBody({ rows, downloadingId, onDownload }) {
  return (
    <>
      {rows.map((row) => {
        const attendanceClass = attendanceChipClass(row.attendanceStatus);
        const registrationClass = String(row.status || "pending").toLowerCase();
        const certCell =
          row.canDownload || row.canGenerate ? (
            <button
              className="btn-download"
              type="button"
              disabled={downloadingId === row.userId}
              onClick={() => onDownload(row)}
            >
              {downloadingId === row.userId ? "…" : "Download"}
            </button>
          ) : (
            <span className="dash-placeholder">—</span>
          );

        return (
          <tr key={row.userId}>
            <td>{row.id}</td>
            <td>{row.timestamp?.display ?? "—"}</td>
            <td>
              <span className={`ecert-chip ecert-chip--registration ${registrationClass}`}>
                {row.status}
              </span>
            </td>
            <td>{row.tapIn || "—"}</td>
            <td>{row.tapOut || "—"}</td>
            <td>
              <span className={`ecert-chip ecert-chip--attendance ${attendanceClass}`}>
                {row.attendanceStatus}
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
  const templateInputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [attendanceQuery, setAttendanceQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const [templateInfo, setTemplateInfo] = useState(null);
  const [templateUploading, setTemplateUploading] = useState(false);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());

      const response = await fetch(`/api/admin/ecert/events?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load events.");
      }

      setEvents(payload.events || []);
    } catch (error) {
      setEvents([]);
      setEventsError(error instanceof Error ? error.message : "Failed to load events.");
    } finally {
      setEventsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const loadTemplateInfo = useCallback(async (eventId) => {
    if (!eventId) return;

    try {
      const response = await fetch(
        `/api/admin/certificates/template?eventId=${encodeURIComponent(eventId)}`,
      );
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        setTemplateInfo(payload);
      }
    } catch {
      setTemplateInfo(null);
    }
  }, []);

  const loadEventDetail = useCallback(
    async (eventId, search = "") => {
      if (!eventId) return;

      setDetailLoading(true);
      setDetailError("");

      try {
        const params = new URLSearchParams({ eventId });
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(`/api/admin/certificates?${params.toString()}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load attendance records.");
        }

        setSelectedEvent(payload.event || null);
        setAttendees(payload.attendees || []);
      } catch (error) {
        setSelectedEvent(null);
        setAttendees([]);
        setDetailError(
          error instanceof Error ? error.message : "Failed to load attendance records.",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!openAttendance) return;
    setDetailOpen(true);
    showStatus("Attendance records");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when opened from Events
  }, [openAttendance]);

  useEffect(() => {
    if (!selectedEventId || !detailOpen) return;
    void loadEventDetail(selectedEventId);
    void loadTemplateInfo(selectedEventId);
  }, [selectedEventId, detailOpen, loadEventDetail, loadTemplateInfo]);

  const visibleCards = useMemo(() => events, [events]);

  const filteredAttendees = useMemo(() => {
    const q = attendanceQuery.trim().toLowerCase();
    if (!q) return attendees;

    return attendees.filter((row) => {
      return (
        row.id.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.organization.toLowerCase().includes(q)
      );
    });
  }, [attendees, attendanceQuery]);

  const detailFields = useMemo(() => buildDetailFields(selectedEvent), [selectedEvent]);

  function openEvent(ev) {
    setSelectedEventId(ev.id);
    setSelectedEvent(ev);
    setDetailOpen(true);
    setAttendanceQuery("");
    showStatus("Viewing attendance");
  }

  async function handleTemplateUpload(file) {
    if (!selectedEventId || !file) return;

    setTemplateUploading(true);

    try {
      const formData = new FormData();
      formData.append("eventId", selectedEventId);
      formData.append("template", file);

      const response = await fetch("/api/admin/certificates/template", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to upload template.");
      }

      setTemplateInfo(payload);
      showStatus("Certificate template uploaded");
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Failed to upload certificate template.",
      );
    } finally {
      setTemplateUploading(false);
      if (templateInputRef.current) {
        templateInputRef.current.value = "";
      }
    }
  }

  async function handleDownload(row) {
    if (!selectedEventId || !row.userId) return;

    if (!row.canDownload && !row.canGenerate) {
      showStatus("Certificate not available yet");
      return;
    }

    setDownloadingId(row.userId);

    try {
      const response = await fetch("/api/admin/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          userId: row.userId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to generate certificate.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `certificate-${row.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);

      showStatus(`Certificate downloaded for ${row.name}`);
      void loadEventDetail(selectedEventId, attendanceQuery);
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Failed to download certificate.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="view ecert-view" id="ecertView">
      <section className="ecert-wrap">
        <div className={`ecert-list-view${detailOpen ? " hidden" : ""}`} id="ecertListView">
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
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          {eventsLoading ? (
            <p className="admin-muted">Loading approved events…</p>
          ) : null}

          {eventsError ? <p className="admin-error">{eventsError}</p> : null}

          {!eventsLoading && !eventsError && visibleCards.length === 0 ? (
            <p className="admin-muted">No approved events found.</p>
          ) : null}

          <div className="ecert-list" id="ecertList">
            {visibleCards.map((ev) => (
              <article key={ev.id} className="event-card" data-ecert-id={ev.id}>
                <div className="event-thumb">
                  {ev.posterImage ? (
                    <Image
                      src={ev.posterImage}
                      alt=""
                      width={82}
                      height={82}
                      unoptimized
                    />
                  ) : (
                    "Image placeholder"
                  )}
                </div>
                <div className="event-info">
                  <h3>{ev.title}</h3>
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

        <div className={`ecert-detail-view${detailOpen ? "" : " hidden"}`} id="ecertDetailView">
          <article className="ecert-detail-card">
            <header className="ecert-detail-card__header">
              <p className="ecert-detail-card__eyebrow">Event attendance</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="btn-sheets"
                  type="button"
                  onClick={() => {
                    setDetailOpen(false);
                    setSelectedEventId(null);
                    showStatus("Back to events");
                  }}
                >
                  Back
                </button>
                <label className="btn-sheets" style={{ cursor: "pointer" }}>
                  {templateUploading
                    ? "Uploading…"
                    : templateInfo?.hasCustomTemplate
                      ? "Replace template"
                      : "Upload template"}
                  <input
                    ref={templateInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={templateUploading || !selectedEventId}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleTemplateUpload(file);
                    }}
                  />
                </label>
              </div>
            </header>

            <h2 className="ecert-detail-card__title">
              {selectedEvent?.title ?? "Event details"}
            </h2>

            {templateInfo ? (
              <p className="admin-muted" style={{ marginBottom: "12px" }}>
                {templateInfo.hasCustomTemplate
                  ? `Custom template: ${templateInfo.fileName ?? "uploaded"}`
                  : "Using default certificate template"}
              </p>
            ) : null}

            <dl className="ecert-meta-grid">
              {detailFields.map((item) => (
                <div key={item.label} className="ecert-meta-field">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            <section className="ecert-table-section" aria-label="Attendee records">
              <div className="ecert-attendance-toolbar">
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
                    id="ecertAttendanceSearch"
                    type="search"
                    placeholder="Search name, course, or student number"
                    value={attendanceQuery}
                    onChange={(e) => setAttendanceQuery(e.target.value)}
                  />
                </label>
              </div>

              {detailLoading ? (
                <p className="admin-muted">Loading attendees…</p>
              ) : null}

              {detailError ? <p className="admin-error">{detailError}</p> : null}

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
                    {!detailLoading && filteredAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={7}>No attendee records yet.</td>
                      </tr>
                    ) : (
                      <EcertTableBody
                        rows={filteredAttendees}
                        downloadingId={downloadingId}
                        onDownload={handleDownload}
                      />
                    )}
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
