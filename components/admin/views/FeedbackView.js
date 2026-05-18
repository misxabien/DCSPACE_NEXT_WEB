"use client";

import { useEffect, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const ROWS = [
  { cat: "event", status: "new", initials: "MG", name: "Misxa Bien D. Germino", email: "misxagermino@sdca.edu.ph" },
  { cat: "event", status: "new", initials: "GE", name: "Gwyneth Mucio", email: "gwyneth@sdca.edu.ph" },
  { cat: "event", status: "actioned", initials: "PC", name: "Paul Cielo", email: "paul@sdca.edu.ph" },
  { cat: "event", status: "actioned", initials: "AM", name: "Amira Marqueses", email: "amira@sdca.edu.ph" },
  { cat: "system", status: "reviewed", initials: "KE", name: "Khrystelle Esplana", email: "khrystelle@sdca.edu.ph" },
  { cat: "system", status: "reviewed", initials: "MG", name: "Misxa Bien D. Germino", email: "misxagermino@sdca.edu.ph" },
];

const STAR_PATH =
  "M12 2.25l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.77l-5.9 3.1 1.13-6.58-4.78-4.66 6.6-.96L12 2.25Z";

function StarRating({ filled = 4, total = 5, size = "md" }) {
  const dim = { sm: 14, md: 16, lg: 20, xl: 24, stat: 16 }[size] ?? 16;
  return (
    <span
      className={`feedback-stars feedback-stars--${size}`}
      role="img"
      aria-label={`${filled} out of ${total} stars`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <svg
            key={i}
            className={`feedback-star-icon${isFilled ? " is-filled" : " is-empty"}`}
            width={dim}
            height={dim}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d={STAR_PATH} />
          </svg>
        );
      })}
    </span>
  );
}

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
    <section className="view feedback-view" id="feedbackView">
      <div className="header-row">
        <h1>Feedback Overview</h1>
      </div>

      <section className="feedback-wrap">
        <div className="feedback-summary">
          <article className="feedback-stat">
            <h3 className="feedback-stat__label">Average event rating</h3>
            <p className="feedback-stat__score" aria-label="4 out of 5">
              <span className="feedback-stat__value">4.0</span>
            </p>
            <StarRating filled={4} size="stat" />
            <p className="feedback-stat__count">(106 events)</p>
          </article>
          <article className="feedback-stat">
            <h3 className="feedback-stat__label">System ease of use</h3>
            <p className="feedback-stat__score" aria-label="4 out of 5">
              <span className="feedback-stat__value">4.0</span>
            </p>
            <StarRating filled={4} size="stat" />
            <p className="feedback-stat__count">(345 users)</p>
          </article>
        </div>

        <div className="feedback-table-wrap">
          <table className="feedback-table">
            <thead>
              <tr>
                <th scope="col">Rating</th>
                <th scope="col">Category</th>
                <th scope="col">User</th>
                <th scope="col">Event</th>
                <th scope="col">Facility</th>
                <th scope="col">Status</th>
                <th scope="col" className="col-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div className="feedback-rating-cell">
                      <StarRating filled={4} />
                      <span className="rating-label">4/5</span>
                    </div>
                  </td>
                  <td>
                    <span className={`feedback-chip feedback-chip--cat ${r.cat}`}>
                      {r.cat === "system" ? "System" : "Event"}
                    </span>
                  </td>
                  <td>
                    <div className="user-col">
                      <div className="avatar-mini">{r.initials}</div>
                      <div>
                        <strong>{r.name}</strong>
                        <small>{r.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>IT WEEK</td>
                  <td>GD 3 – DRA Hall</td>
                  <td>
                    <span className={`feedback-chip feedback-chip--status ${r.status}`}>
                      {r.status === "new"
                        ? "New"
                        : r.status === "actioned"
                          ? "Actioned"
                          : "Reviewed"}
                    </span>
                  </td>
                  <td className="col-actions">
                    <button
                      className="btn-view feedback-row-btn"
                      type="button"
                      onClick={() => {
                        setModalOpen(true);
                        showStatus("Viewing feedback details");
                      }}
                    >
                      View
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
            <span id="feedbackModalTitle">Feedback · Misxa Bien D. Germino</span>
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
            <section className="fm-section">
            <h3 className="fm-section-title">User information</h3>
            <div className="fm-card fm-user">
              <div className="fm-avatar">MG</div>
              <div>
                <h4>Misxa Bien D. Germino</h4>
                <small>Email: misxabien.germino@sdca.edu.ph</small>
                <small>Student number: 202312345</small>
                <small>Course: BSIT – Bachelor of Science in Information Technology</small>
                <small>Year and section: 3 – B</small>
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
            </div>
            </section>

            <section className="fm-section">
            <h3 className="fm-section-title">Rating & feedback</h3>
            <div className="fm-rating-grid">
              <div className="fm-rating-box">
                <StarRating filled={4} size="lg" />
                <div className="score">
                  4<small>/5</small>
                </div>
              </div>
              <div className="fm-comment-box">
                <strong>Comment</strong>
                <p>
                  Overall great experience at IT WEEK! The GD 3 – DRA Hall venue was spacious and
                  well-equipped. Looking forward to the next one. Maybe the workshop timings could
                  be slightly longer.
                </p>
              </div>
            </div>
            </section>

            <section className="fm-section">
            <h3 className="fm-section-title">Event details</h3>
            <div className="fm-card fm-row-grid">
              <div className="fm-ev-cell">
                <strong>Category</strong>
                <span className="fm-ev-val">Event feedback</span>
              </div>
              <div className="fm-ev-cell">
                <strong>Event name</strong>
                <span className="fm-ev-val">BSIT WEEK</span>
              </div>
              <div className="fm-ev-cell">
                <strong>Location</strong>
                <span className="fm-ev-val">GD 3 – DRA Hall</span>
              </div>
              <div className="fm-ev-cell">
                <strong>Date</strong>
                <span className="fm-ev-val">April 4, 2026</span>
              </div>
            </div>
            </section>

            <section className="fm-section">
            <h3 className="fm-section-title">Admin actions</h3>
            <div className="fm-actions">
              <button
                className="fm-btn-soft"
                id="viewCertCopyBtn"
                type="button"
                onClick={() => showStatus("Viewing certificate copy")}
              >
                View original e-certificate
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
                Send follow-up email
              </button>
            </div>
            </section>

            <section className="fm-section">
            <h3 className="fm-section-title">Admin note</h3>
            <div className="fm-card fm-note-card">
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
            </div>
            </section>

            <section className="fm-section fm-section--status">
            <div className="fm-status-row">
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
                onClick={() => showStatus(`Status changed to ${statusVal}`)}
              >
                Change status
              </button>
            </div>
            </section>

            <p className="fm-submitted">Submitted on April 6, 2026 · 11:11 AM</p>
          </div>
        </div>
      </div>
    </section>
  );
}


