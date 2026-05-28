"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

function formatSubmittedAt(value) {
  if (!value) return "Submitted recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Submitted recently";
  return `Submitted ${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} · ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function buildDetailFields(detail) {
  if (!detail) return [];
  return [
    { label: "Date", value: detail.date || "—" },
    { label: "Venue", value: detail.venue || "—" },
    { label: "Start time", value: detail.startTime || "—" },
    { label: "End time", value: detail.endTime || "—" },
    { label: "Organizer", value: detail.organizer || "—" },
    { label: "Campus", value: detail.campus || "—" },
    { label: "Department", value: detail.department || "—" },
    { label: "Course", value: detail.course || "—" },
    { label: "Organization", value: detail.organization || "—" },
    { label: "Event type", value: detail.type || "—" },
    { label: "Duration", value: detail.duration || "—" },
    { label: "Minimum attendance", value: detail.minimumAttendanceTime || "—" },
  ];
}

function buildAttachmentFiles(detail) {
  if (!detail?.attachments) return [];
  const files = [];
  if (detail.attachments.eventPoster) {
    files.push({ title: "Event Poster", file: "poster", url: detail.attachments.eventPoster });
  }
  if (detail.attachments.roomReservationForm) {
    files.push({ title: "Room Reservation Form", file: "room-reservation" });
  }
  if (detail.attachments.approvedConceptPaper) {
    files.push({ title: "Approved Concept Paper", file: "concept-paper" });
  }
  if (detail.attachments.eCertificateTemplate) {
    files.push({ title: "E-Certificate Template", file: "certificate-template" });
  }
  return files;
}

export function EventsView() {
  const showStatus = useShowStatus();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [approvedToggleOn, setApprovedToggleOn] = useState(true);

  const isApprovedTab = tab === "approved";

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const params = new URLSearchParams();
      params.set("status", tab);
      params.set("limit", "50");
      if (query.trim()) params.set("search", query.trim());

      const response = await fetch(`/api/admin/events?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load events.");
      }

      setEvents(payload.events || []);
    } catch (error) {
      setEvents([]);
      setLoadError(error instanceof Error ? error.message : "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const visibleCards = useMemo(() => events, [events]);

  const openDetail = useCallback(
    async (eventId) => {
      setSelectedId(eventId);
      setDetailOpen(true);
      setDetailLoading(true);
      setAdminComment("");

      try {
        const response = await fetch(`/api/admin/events/${eventId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load event details.");
        }
        setDetail(payload);
        setApprovedToggleOn(true);
        showStatus("Viewing event details");
      } catch (error) {
        setDetail(null);
        showStatus(error instanceof Error ? error.message : "Failed to load event details.");
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [showStatus],
  );

  async function moderateEvent(action) {
    if (!selectedId || !detail) return;

    const needsComment = action === "requestChanges";
    if (needsComment && !adminComment.trim()) {
      showStatus("Add a comment explaining the requested changes.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: adminComment.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update event.");
      }

      const labels = {
        approve: "Event approved — organizer notified",
        reject: "Event rejected — organizer notified",
        requestChanges: "Changes requested — organizer notified",
      };
      showStatus(labels[action] || "Event updated");

      setDetailOpen(false);
      setDetail(null);
      setSelectedId(null);
      setAdminComment("");
      await loadEvents();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Failed to update event.");
    } finally {
      setActionLoading(false);
    }
  }

  const detailFields = buildDetailFields(detail);
  const detailFiles = buildAttachmentFiles(detail);

  return (
    <section className="view" id="eventsView">
      <div className="header-row">
        <h1>Event Management</h1>
      </div>

      <section className="events-wrap">
        <div className="events-toolbar">
          <div className="event-tabs">
            <button
              className={`event-tab${tab === "pending" ? " active" : ""}`}
              type="button"
              onClick={() => {
                setTab("pending");
                setDetailOpen(false);
                showStatus("Pending events");
              }}
            >
              Pending Events
            </button>
            <button
              className={`event-tab${tab === "approved" ? " active" : ""}`}
              type="button"
              onClick={() => {
                setTab("approved");
                setDetailOpen(false);
                showStatus("Approved events");
              }}
            >
              Approved Events
            </button>
          </div>
        </div>

        <div className={`event-list-view${detailOpen ? " hidden" : ""}`} id="eventListView">
          <div className="events-search-row">
            <label className="search-wrap">
              <span aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="eventSearch"
                type="search"
                placeholder="Search events"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadEvents();
                }}
              />
            </label>
            <button className="btn-soft" type="button" disabled={loading} onClick={() => void loadEvents()}>
              {loading ? "Loading…" : "Search"}
            </button>
          </div>

          <div className="events-list" id="eventsList">
            {loading ? (
              <p style={{ padding: "24px 12px", textAlign: "center" }}>Loading events from database…</p>
            ) : null}
            {!loading && loadError ? (
              <p style={{ padding: "24px 12px", textAlign: "center", color: "#9f2f2f" }}>{loadError}</p>
            ) : null}
            {!loading && !loadError && visibleCards.length === 0 ? (
              <p style={{ padding: "24px 12px", textAlign: "center" }}>
                {isApprovedTab
                  ? "No approved events yet."
                  : "No pending events. Submitted events from the user app will appear here."}
              </p>
            ) : null}
            {!loading &&
              !loadError &&
              visibleCards.map((ev) => (
                <article key={ev.id} className="event-card" data-event-id={ev.id}>
                  {ev.pubmatImage ? (
                    <div className="event-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ev.pubmatImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div className="event-thumb">No poster</div>
                  )}
                  <div className="event-info">
                    <h3>{ev.title}</h3>
                    <p>
                      {ev.date}
                      {ev.time ? ` · ${ev.time}` : ""}
                    </p>
                    <p>{ev.venue}</p>
                    <p>{ev.organizer}</p>
                  </div>
                  <button className="btn-view" type="button" onClick={() => void openDetail(ev.id)}>
                    View details
                  </button>
                </article>
              ))}
          </div>
        </div>

        <div className={`event-detail-view${detailOpen ? "" : " hidden"}`} id="eventDetailView">
          <div className="detail-top">
            <div
              className={`detail-state-pill ${isApprovedTab || detail?.status === "approved" ? "approved" : "pending"}`}
              id="detailStatePill"
            >
              {detailLoading
                ? "Loading…"
                : isApprovedTab || detail?.status === "approved"
                  ? "Approved event"
                  : detail?.status === "rejected"
                    ? "Rejected event"
                    : detail?.status === "changes_requested"
                      ? "Changes requested"
                      : "Pending approval"}
            </div>
            <div
              className={`detail-actions${isApprovedTab || detail?.status === "approved" ? " hidden" : ""}`}
              id="pendingActions"
            >
              <button
                className="btn-approve"
                type="button"
                disabled={actionLoading || detailLoading}
                onClick={() => void moderateEvent("approve")}
              >
                Approve
              </button>
              <button
                className="btn-reject"
                type="button"
                disabled={actionLoading || detailLoading}
                onClick={() => void moderateEvent("reject")}
              >
                Reject
              </button>
              <button
                className="btn-request"
                type="button"
                disabled={actionLoading || detailLoading}
                onClick={() => void moderateEvent("requestChanges")}
              >
                Request changes
              </button>
              <button
                className="btn-soft"
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setDetail(null);
                  showStatus("Back to events");
                }}
              >
                Back
              </button>
            </div>
            <div
              className={`detail-actions detail-actions--approved${isApprovedTab || detail?.status === "approved" ? "" : " hidden"}`}
              id="approvedActions"
            >
              <Link
                className="btn-primary btn-tap-attendance"
                href={detail ? `/admin/tap?event=${encodeURIComponent(detail.title)}` : "/admin/tap"}
                onClick={() => showStatus("Opening tap in / tap out")}
              >
                Tap in / Tap out
              </Link>
              <button
                className="btn-soft"
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setDetail(null);
                  showStatus("Back to events");
                }}
              >
                Back
              </button>
              <button
                className={`detail-status-toggle${approvedToggleOn ? "" : " off"}`}
                type="button"
                aria-label="Approved status toggle"
                onClick={() => {
                  setApprovedToggleOn((v) => !v);
                  showStatus(approvedToggleOn ? "Event marked inactive" : "Event marked active");
                }}
              />
            </div>
          </div>

          <article className="event-detail-card">
            {detailLoading ? (
              <p style={{ padding: 24 }}>Loading event details…</p>
            ) : detail ? (
              <>
                <header className="event-detail-card__header">
                  <p className="event-detail-card__eyebrow">Event details</p>
                  <span className="submitted">{formatSubmittedAt(detail.submittedAt)}</span>
                </header>

                <h2 className="detail-title">{detail.title}</h2>
                <p className="detail-desc">{detail.description || "No description provided."}</p>

                <section className="detail-section" aria-label="Event information">
                  <h3 className="detail-section__title">Information</h3>
                  <dl className="detail-grid">
                    {detailFields.map((field) => (
                      <div key={field.label} className="detail-field">
                        <dt className="detail-field__label">{field.label}</dt>
                        <dd className="detail-field__value">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {detailFiles.length > 0 ? (
                  <section className="detail-section" aria-label="Attachments">
                    <h3 className="detail-section__title">Attachments</h3>
                    <div className="files-row">
                      {detailFiles.map((file) => (
                        <a
                          key={file.file}
                          href={file.url || "#"}
                          target={file.url ? "_blank" : undefined}
                          rel={file.url ? "noreferrer" : undefined}
                          className="file-card"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <span className="file-card__icon" aria-hidden="true">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span className="file-card__title">{file.title}</span>
                          <span className="file-card__name">{file.url ? "View file" : "Not uploaded"}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                ) : null}

                {detail.latestAdminComment ? (
                  <section className="detail-section" aria-label="Previous admin comment">
                    <h3 className="detail-section__title">Previous admin note</h3>
                    <p>{detail.latestAdminComment}</p>
                  </section>
                ) : null}

                {!isApprovedTab && detail.status !== "approved" ? (
                  <section className="admin-comment" aria-label="Admin comment">
                    <label className="admin-comment__label" htmlFor="adminCommentInput">
                      Admin note (required for request changes)
                    </label>
                    <input
                      type="text"
                      id="adminCommentInput"
                      placeholder="Write a comment for the organizer…"
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                    />
                  </section>
                ) : null}
              </>
            ) : (
              <p style={{ padding: 24 }}>Event details unavailable.</p>
            )}
          </article>
        </div>
      </section>
    </section>
  );
}
