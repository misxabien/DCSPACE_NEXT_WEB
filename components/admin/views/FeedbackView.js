"use client";

import { useEffect, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const ROWS = [
  { cat: "event", status: "new" },
  { cat: "event", status: "new" },
  { cat: "event", status: "actioned" },
  { cat: "event", status: "actioned" },
  { cat: "system", status: "reviewed" },
  { cat: "system", status: "reviewed" },
];

export function FeedbackView() {
  const showStatus = useShowStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [statusVal, setStatusVal] = useState("new");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setModalOpen(false);
    }
    if (modalOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  return (
    <section className="view" id="feedbackView">
      <div className="header-row">
        <h1>Feedback Overview</h1>
      </div>

      <section className="feedback-wrap">
        <div className="feedback-summary">
          <article className="feedback-stat">
            <div className="feedback-star">★</div>
            <div>
              <h3>Average Event Rating</h3>
              <p>4 / 5 ★★★★</p>
              <small>from 106 events</small>
            </div>
          </article>
          <article className="feedback-stat">
            <div className="feedback-star">★</div>
            <div>
              <h3>System Ease of Use</h3>
              <p>4 / 5 ★★★★</p>
              <small>from 345 users</small>
            </div>
          </article>
        </div>

        <div className="feedback-table-wrap">
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Rating</th>
                <th>Category</th>
                <th>User</th>
                <th>Event</th>
                <th>Facility</th>
                <th>Status</th>
                <th>…</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span className="rating-stars">★★★★</span>
                    <span className="rating-label">4/5</span>
                  </td>
                  <td>
                    <span
                      className={`chip-cat${r.cat === "system" ? " system" : ""}`}
                    >
                      {r.cat === "system" ? "System" : "Event"}
                    </span>
                  </td>
                  <td>
                    <div className="user-col">
                      <div className="avatar-mini">MG</div>
                      <div>
                        <strong>Misxa Bien D. Germino</strong>
                        <small>misxagermino@sdca.edu.ph</small>
                      </div>
                    </div>
                  </td>
                  <td>IT WEEK</td>
                  <td>GD 3 -DRA HALL</td>
                  <td>
                    <span className={`status-chip ${r.status}`}>
                      {r.status === "new"
                        ? "New"
                        : r.status === "actioned"
                          ? "Actioned"
                          : "Reviewed"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-view-mini"
                      type="button"
                      onClick={() => {
                        setModalOpen(true);
                        showStatus("Viewing feedback details");
                      }}
                    >
                      View »
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div
        className={`feedback-modal-overlay${modalOpen ? " open" : ""}`}
        id="feedbackModalOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div
          className="feedback-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedbackModalTitle"
        >
          <div className="fm-head">
            <span id="feedbackModalTitle">
              Feedback · Misxa Bien D. Germino
            </span>
            <button
              className="fm-close"
              id="feedbackModalClose"
              type="button"
              aria-label="Close feedback detail"
              onClick={() => setModalOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="fm-body">
            <h3 className="fm-section-title">User Information</h3>
            <section className="fm-card fm-user">
              <div className="fm-avatar">MG</div>
              <div>
                <h4>Misxa Bien D. Germino</h4>
                <small>Email: misxabien.germino@sdca.edu.ph</small>
                <small>Student Number: 202312345</small>
                <small>
                  Course: BSIT - Bachelor of Science in Information Technology
                </small>
                <small>Year and Section: 3 - B</small>
              </div>
              <div className="fm-role-panel">
                <div className="fm-role-block">
                  <span className="fm-role-kicker">Organization</span>
                  <span className="fm-role-org">Domini Xode</span>
                </div>
                <div className="fm-role-block">
                  <span className="fm-role-kicker">Role</span>
                  <button
                    type="button"
                    className="fm-role-badge"
                    aria-label="Role: Officer. Change role"
                    onClick={() => showStatus("Role options (demo)")}
                  >
                    <span className="fm-role-badge-text">Officer</span>
                    <span className="fm-role-badge-chev" aria-hidden="true">
                      ▼
                    </span>
                  </button>
                </div>
              </div>
            </section>

            <h3 className="fm-section-title">Rating & Feedback</h3>
            <section className="fm-rating-grid">
              <div className="fm-rating-box">
                <div className="stars">★★★★</div>
                <div className="score">
                  4<small>/5</small>
                </div>
              </div>
              <div className="fm-comment-box">
                <strong>Comment</strong>
                <br />
                Overall great experience at IT WEEK! The GD 3 - DRA HALL venue
                was spacious and well-equipped. Looking forward to the next
                one. Maybe the workshop timings could be slightly longer.
              </div>
            </section>

            <h3 className="fm-section-title">Event Details</h3>
            <section className="fm-card fm-row-grid">
              <div className="fm-ev-cell">
                <strong>Category</strong>
                <span className="fm-ev-val fm-ev-val--cat">Event feedback</span>
              </div>
              <div className="fm-ev-cell">
                <strong>Event Name</strong>
                <span className="fm-ev-val fm-ev-val--name">BSIT WEEK</span>
              </div>
              <div className="fm-ev-cell">
                <strong>Location</strong>
                <span className="fm-ev-val fm-ev-val--venue">
                  GD 3 - DRA HALL
                </span>
              </div>
              <div className="fm-ev-cell">
                <strong>Date</strong>
                <span className="fm-ev-val fm-ev-val--date">
                  April 04, 2026
                </span>
              </div>
            </section>

            <h3 className="fm-section-title">Admin Actions</h3>
            <section className="fm-actions">
              <button
                className="fm-btn-soft"
                id="viewCertCopyBtn"
                type="button"
                onClick={() => showStatus("Viewing certificate copy")}
              >
                View Original Copy of E-Certificate
              </button>
              <button
                className="fm-btn-soft"
                id="downloadFeedbackPdfBtn"
                type="button"
                onClick={() => showStatus("Downloading feedback PDF")}
              >
                Download PDF
              </button>
              <button
                className="fm-btn-soft"
                id="followUpEmailBtn"
                type="button"
                onClick={() => showStatus("Follow-up email sent")}
              >
                Send Follow-up Email
              </button>
            </section>

            <h3 className="fm-section-title">Admin Note</h3>
            <section className="fm-card">
              <div className="fm-note-row">
                <input
                  id="feedbackAdminNoteInput"
                  type="text"
                  placeholder="Add an internal note…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  className="fm-send"
                  id="feedbackSendNoteBtn"
                  type="button"
                  onClick={() => {
                    if (note.trim()) {
                      showStatus("Admin note sent");
                      setNote("");
                    } else {
                      showStatus("Please enter a note first");
                    }
                  }}
                >
                  Send
                </button>
              </div>
            </section>

            <section className="fm-status-row">
              <strong>Status</strong>
              <select
                id="feedbackStatusSelect"
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
              >
                <option value="new">New</option>
                <option value="actioned">Actioned</option>
                <option value="reviewed">Reviewed</option>
              </select>
              <button
                className="fm-change"
                id="feedbackChangeStatusBtn"
                type="button"
                onClick={() =>
                  showStatus(`Status changed to ${statusVal}`)
                }
              >
                Change Status
              </button>
            </section>

            <div className="fm-submitted">
              Submitted On: 04-06-2026 &nbsp; 11:11 AM
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
