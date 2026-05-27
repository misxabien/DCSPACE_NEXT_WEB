"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const EVENT_CARDS = [
  { name: "Digital Campus Ugnayan Seminar" },
  { name: "Career and Leadership Summit" },
  { name: "Campus Research Symposium" },
];

const DETAIL_FIELDS = [
  { label: "Date", value: "April 15, 2026" },
  { label: "Venue", value: "DRA Hall" },
  { label: "Start time", value: "1:00 PM" },
  { label: "End time", value: "5:00 PM" },
  { label: "Organizer", value: "Misxa Bien Germino" },
  { label: "Campus", value: "Main" },
  { label: "Department", value: "SCMCS" },
  { label: "Course", value: "BSIT" },
  { label: "Organization", value: "Domini Xode" },
  { label: "Event type", value: "Seminar" },
  { label: "Duration", value: "5 hours" },
  { label: "Minimum attendance", value: "4 hours" },
];

const DETAIL_FILES = [
  { title: "Event Poster", file: "dc-seminar.pdf" },
  { title: "Room Reservation Form", file: "dro.pdf" },
  { title: "Approved Concept Paper", file: "concept-dc.pdf" },
  { title: "E-Certificate Template", file: "cert_template.pdf" },
];

export function EventsView() {
  const showStatus = useShowStatus();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [approvedToggleOn, setApprovedToggleOn] = useState(true);

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENT_CARDS.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [query]);

  const isApprovedTab = tab === "approved";

  function openDetail() {
    setApprovedToggleOn(true);
    setDetailOpen(true);
    showStatus("Viewing event details");
  }

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
              data-event-tab="pending"
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
              data-event-tab="approved"
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
                onChange={(e) => {
                  setQuery(e.target.value);
                  const q = e.target.value.trim().toLowerCase();
                  const n = EVENT_CARDS.filter(
                    (c) => !q || c.name.toLowerCase().includes(q),
                  ).length;
                  showStatus(`${n} event(s) shown`);
                }}
              />
            </label>
          </div>

          <div className="events-list" id="eventsList">
            {visibleCards.map((ev) => (
              <article key={ev.name} className="event-card" data-event-name={ev.name}>
                <div className="event-thumb">Image placeholder</div>
                <div className="event-info">
                  <h3>{ev.name}</h3>
                  <p>Event date and time</p>
                  <p>Event venue</p>
                  <p>Organizer</p>
                </div>
                <button className="btn-view" type="button" onClick={openDetail}>
                  View details
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className={`event-detail-view${detailOpen ? "" : " hidden"}`} id="eventDetailView">
          <div className="detail-top">
            <div
              className={`detail-state-pill ${isApprovedTab ? "approved" : "pending"}`}
              id="detailStatePill"
            >
              {isApprovedTab ? "Approved event" : "Pending approval"}
            </div>
            <div className={`detail-actions${isApprovedTab ? " hidden" : ""}`} id="pendingActions">
              <button
                className="btn-approve"
                type="button"
                id="approveEventBtn"
                onClick={() => showStatus("Event approved")}
              >
                Approve
              </button>
              <button
                className="btn-reject"
                type="button"
                id="rejectEventBtn"
                onClick={() => showStatus("Event rejected")}
              >
                Reject
              </button>
              <button
                className="btn-request"
                type="button"
                id="requestChangesBtn"
                onClick={() => showStatus("Requested changes sent")}
              >
                Request changes
              </button>
              <button
                className="btn-soft"
                type="button"
                id="backToEventsBtn"
                onClick={() => {
                  setDetailOpen(false);
                  showStatus("Back to events");
                }}
              >
                Back
              </button>
            </div>
            <div
              className={`detail-actions detail-actions--approved${isApprovedTab ? "" : " hidden"}`}
              id="approvedActions"
            >
              <Link
                className="btn-primary btn-tap-attendance"
                href="/admin/tap?event=Digital%20Campus%20Ugnayan%20Seminar"
                onClick={() => showStatus("Opening tap in / tap out")}
              >
                Tap in / Tap out
              </Link>
              <button
                className="btn-soft"
                type="button"
                id="backToEventsBtnApproved"
                onClick={() => {
                  setDetailOpen(false);
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
                  setApprovedToggleOn((v) => {
                    const next = !v;
                    showStatus(next ? "Approved event is active" : "Approved event is inactive");
                    return next;
                  });
                }}
              />
            </div>
          </div>

          <article className="event-detail-card">
            <header className="event-detail-card__header">
              <p className="event-detail-card__eyebrow">Event details</p>
              <span className="submitted">Submitted March 26, 2026 · 3:39 PM</span>
            </header>

            <h2 className="detail-title">Digital Campus Ugnayan Seminar</h2>
            <p className="detail-desc">
              This seminar covers &quot;Digital Footprints in AI&quot; and &quot;Lifelong Learner in
              AI&quot;, guiding students on online responsibility, how their digital activities are
              tracked, and the importance of continuous learning.
            </p>

            <section className="detail-section" aria-label="Event information">
              <h3 className="detail-section__title">Information</h3>
              <dl className="detail-grid">
                {DETAIL_FIELDS.map((field) => (
                  <div key={field.label} className="detail-field">
                    <dt className="detail-field__label">{field.label}</dt>
                    <dd className="detail-field__value">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="detail-section" aria-label="Attachments">
              <h3 className="detail-section__title">Attachments</h3>
              <div className="files-row">
                {DETAIL_FILES.map((file) => (
                  <button key={file.file} type="button" className="file-card">
                    <span className="file-card__icon" aria-hidden="true">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 4v4h4M9 13h6M9 17h4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span className="file-card__title">{file.title}</span>
                    <span className="file-card__name">{file.file}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="admin-comment" aria-label="Admin comment">
              <label className="admin-comment__label" htmlFor="adminCommentInput">
                Admin note
              </label>
              <input
                type="text"
                id="adminCommentInput"
                placeholder="Write a comment for the organizer…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    showStatus("Admin comment added");
                  }
                }}
              />
            </section>
          </article>
        </div>
      </section>
    </section>
  );
}
