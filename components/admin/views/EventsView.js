"use client";

import { useMemo, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const EVENT_CARDS = [
  { name: "Digital Campus Ugnayan Seminar" },
  { name: "Career and Leadership Summit" },
  { name: "Campus Research Symposium" },
];

export function EventsView() {
  const showStatus = useShowStatus();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [approvedToggleOn, setApprovedToggleOn] = useState(true);

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENT_CARDS.filter(
      (c) => !q || c.name.toLowerCase().includes(q)
    );
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
              ◉ Pending Events
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
              ◌ Approved Events
            </button>
          </div>
          <div className="events-searchbar">
            <span>Filter: All</span>
            <label className="search-wrap">
              <span>🔎</span>
              <input
                id="eventSearch"
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const q = e.target.value.trim().toLowerCase();
                  const n = EVENT_CARDS.filter(
                    (c) => !q || c.name.toLowerCase().includes(q)
                  ).length;
                  showStatus(`${n} event(s) shown`);
                }}
              />
            </label>
          </div>
        </div>

        <div
          className={`event-list-view${detailOpen ? " hidden" : ""}`}
          id="eventListView"
        >
          <div className="events-list" id="eventsList">
            {visibleCards.map((ev) => (
              <article
                key={ev.name}
                className="event-card"
                data-event-name={ev.name}
              >
                <div className="event-thumb">image placeholder</div>
                <div className="event-info">
                  <h3>Event Name</h3>
                  <p>Event Date and Time</p>
                  <p>Event Venue</p>
                  <p>Event Representative or Organizer</p>
                </div>
                <button
                  className="btn-view"
                  type="button"
                  onClick={openDetail}
                >
                  View Details »
                </button>
              </article>
            ))}
          </div>
        </div>

        <div
          className={`event-detail-view${detailOpen ? "" : " hidden"}`}
          id="eventDetailView"
        >
          <div className="detail-top">
            <div
              className={`detail-state-pill ${
                isApprovedTab ? "approved" : "pending"
              }`}
              id="detailStatePill"
            >
              {isApprovedTab ? "✪ Approved Event" : "◉ Pending Approval"}
            </div>
            <div
              className={`detail-actions${isApprovedTab ? " hidden" : ""}`}
              id="pendingActions"
            >
              <button
                className="btn-approve"
                type="button"
                id="approveEventBtn"
                onClick={() => showStatus("Event approved")}
              >
                Approved
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
                Request Changes
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
              className={`detail-actions${isApprovedTab ? "" : " hidden"}`}
              id="approvedActions"
            >
              <button
                className={`detail-status-toggle${approvedToggleOn ? "" : " off"}`}
                type="button"
                aria-label="Approved status toggle"
                onClick={() => {
                  setApprovedToggleOn((v) => {
                    const next = !v;
                    showStatus(
                      next
                        ? "Approved event is active"
                        : "Approved event is inactive"
                    );
                    return next;
                  });
                }}
              />
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
            </div>
          </div>

          <article className="event-detail-card">
            <div className="event-meta">
              <strong>EVENT DETAILS</strong>
              <span className="submitted">
                Submitted: March 26, 2026 • 3:39 PM
              </span>
            </div>
            <h2 className="detail-title">DIGITAL CAMPUS UGNAYAN SEMINAR</h2>
            <p className="detail-desc">
              This seminar covers &quot;Digital Footprints in AI&quot; and
              &quot;Lifelong Learner in AI&quot;, guiding students on online
              responsibility, how their digital activities are tracked, and the
              importance of continuous learning.
            </p>

            <div className="detail-grid">
              <div>🗓 Date: April 15, 2026</div>
              <div>📍 Venue: DRA HALL</div>
              <div>⏰ Start: 1:00 PM</div>
              <div>⏳ End Time: 5:00 PM</div>
              <div>👤 Requesting Organizer: Misxa Bien Germino</div>
              <div>🏫 Campus: MAIN</div>
              <div>🏢 Department: SCMCS</div>
              <div>📄 Course: BSIT</div>
              <div>🏛 Organization: Domini Xode</div>
              <div>🛡 Type of Event: Seminar</div>
              <div>⌛ Total Time Duration: 5 Hours</div>
              <div>🕒 Minimum Attendance Time Required: 4 Hours</div>
            </div>

            <div className="files-row">
              <div className="file-card">
                <span>🖼</span>
                <small>
                  Event Poster
                  <br />
                  dc-seminar.pdf
                </small>
              </div>
              <div className="file-card">
                <span>📄</span>
                <small>
                  Room Reservation Form
                  <br />
                  dro.pdf
                </small>
              </div>
              <div className="file-card">
                <span>📄</span>
                <small>
                  Approved Concept Paper
                  <br />
                  concept-dc.pdf
                </small>
              </div>
              <div className="file-card">
                <span>📜</span>
                <small>
                  E-Certificate Template
                  <br />
                  cert_template.pdf
                </small>
              </div>
            </div>

            <div className="admin-comment">
              <h4>Admin</h4>
              <input
                type="text"
                id="adminCommentInput"
                placeholder="write a comment..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    showStatus("Admin comment added");
                  }
                }}
              />
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
