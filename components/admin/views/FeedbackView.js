"use client";

import { useCallback, useEffect, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const STAR_PATH =
  "M12 2.25l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.77l-5.9 3.1 1.13-6.58-4.78-4.66 6.6-.96L12 2.25Z";

function StarRating({ filled = 0, total = 5, size = "md" }) {
  const dim = { sm: 14, md: 16, lg: 20, xl: 24, stat: 16 }[size] ?? 16;
  const safeFilled = Math.max(0, Math.min(total, Math.round(filled)));

  return (
    <span
      className={`feedback-stars feedback-stars--${size}`}
      role="img"
      aria-label={`${safeFilled} out of ${total} stars`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < safeFilled;
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

function statusLabel(status) {
  if (status === "actioned") return "Actioned";
  if (status === "reviewed") return "Reviewed";
  return "New";
}

function downloadFeedbackText(detail) {
  const lines = [
    `Feedback · ${detail.user.name}`,
    `Status: ${statusLabel(detail.status)}`,
    `Category: ${detail.category === "system" ? "System" : "Event"}`,
    `Rating: ${detail.rating ?? "—"}/${detail.ratingOutOf}`,
    `Event: ${detail.event.name}`,
    `Location: ${detail.event.location}`,
    `Date: ${detail.event.date}`,
    "",
    "Comment:",
    detail.comment,
    "",
    `Submitted: ${detail.submittedAt}`,
  ];

  if (detail.adminNotes.length) {
    lines.push("", "Admin notes:");
    detail.adminNotes.forEach((note) => {
      lines.push(`- ${note.text} (${note.createdAt})`);
    });
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `feedback-${detail.id}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FeedbackView() {
  const showStatus = useShowStatus();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [summary, setSummary] = useState({
    averageEventRating: 0,
    averageEventRatingCount: 0,
    systemEaseOfUse: 0,
    systemEaseOfUseCount: 0,
  });
  const [rows, setRows] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [statusVal, setStatusVal] = useState("new");
  const [saving, setSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/admin/feedback");
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load feedback.");
      }

      setSummary({
        averageEventRating: payload.averageEventRating ?? 0,
        averageEventRatingCount: payload.averageEventRatingCount ?? 0,
        systemEaseOfUse: payload.systemEaseOfUse ?? 0,
        systemEaseOfUseCount: payload.systemEaseOfUseCount ?? 0,
      });
      setRows(payload.feedbackList || []);
    } catch (error) {
      setRows([]);
      setLoadError(error instanceof Error ? error.message : "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setModalOpen(false);
    }
    if (modalOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openDetail = useCallback(
    async (id) => {
      setSelectedId(id);
      setModalOpen(true);
      setDetailLoading(true);
      setNote("");

      try {
        const response = await fetch(`/api/admin/feedback/${id}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load feedback details.");
        }

        setDetail(payload);
        setStatusVal(payload.status || "new");
        showStatus("Viewing feedback details");
      } catch (error) {
        setDetail(null);
        showStatus(error instanceof Error ? error.message : "Failed to load details.");
        setModalOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [showStatus],
  );

  async function saveStatus() {
    if (!selectedId) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/feedback/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusVal }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to update status.");
      }

      setDetail(payload);
      setRows((current) =>
        current.map((row) =>
          row.id === selectedId ? { ...row, status: payload.status } : row,
        ),
      );
      showStatus(`Status changed to ${statusLabel(payload.status)}`);
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  async function sendAdminNote() {
    if (!selectedId || !note.trim()) {
      showStatus("Please enter a note first");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/feedback/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save note.");
      }

      setDetail(payload);
      setNote("");
      showStatus("Admin note saved");
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Failed to save note.");
    } finally {
      setSaving(false);
    }
  }

  const eventRatingDisplay = Math.round(summary.averageEventRating || 0);
  const systemRatingDisplay = Math.round(summary.systemEaseOfUse || 0);

  return (
    <section className="view feedback-view" id="feedbackView">
      <div className="header-row">
        <h1>Feedback Overview</h1>
      </div>

      <section className="feedback-wrap">
        <div className="feedback-summary">
          <article className="feedback-stat">
            <h3 className="feedback-stat__label">Average event rating</h3>
            <p
              className="feedback-stat__score"
              aria-label={`${summary.averageEventRating} out of 5`}
            >
              <span className="feedback-stat__value">
                {summary.averageEventRating.toFixed(1)}
              </span>
            </p>
            <StarRating filled={eventRatingDisplay} size="stat" />
            <p className="feedback-stat__count">
              ({summary.averageEventRatingCount} event
              {summary.averageEventRatingCount === 1 ? "" : "s"})
            </p>
          </article>
          <article className="feedback-stat">
            <h3 className="feedback-stat__label">System ease of use</h3>
            <p
              className="feedback-stat__score"
              aria-label={`${summary.systemEaseOfUse} out of 5`}
            >
              <span className="feedback-stat__value">
                {summary.systemEaseOfUse.toFixed(1)}
              </span>
            </p>
            <StarRating filled={systemRatingDisplay} size="stat" />
            <p className="feedback-stat__count">
              ({summary.systemEaseOfUseCount} user
              {summary.systemEaseOfUseCount === 1 ? "" : "s"})
            </p>
          </article>
        </div>

        {loading ? <p className="admin-muted">Loading feedback…</p> : null}
        {loadError ? <p className="admin-error">{loadError}</p> : null}

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
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>No feedback submitted yet.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="feedback-rating-cell">
                        {r.rating ? (
                          <>
                            <StarRating filled={r.rating} />
                            <span className="rating-label">
                              {r.rating}/{r.ratingOutOf}
                            </span>
                          </>
                        ) : (
                          <span className="dash-placeholder">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`feedback-chip feedback-chip--cat ${r.category}`}>
                        {r.category === "system" ? "System" : "Event"}
                      </span>
                    </td>
                    <td>
                      <div className="user-col">
                        <div className="avatar-mini">{r.user.initials}</div>
                        <div>
                          <strong>{r.user.name}</strong>
                          <small>{r.user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{r.eventName}</td>
                    <td>{r.facility}</td>
                    <td>
                      <span className={`feedback-chip feedback-chip--status ${r.status}`}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        className="btn-view feedback-row-btn"
                        type="button"
                        onClick={() => void openDetail(r.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
              {detail
                ? `Feedback · ${detail.user.name}`
                : detailLoading
                  ? "Loading feedback…"
                  : "Feedback"}
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

          {detailLoading ? (
            <div className="fm-body">
              <p className="admin-muted">Loading details…</p>
            </div>
          ) : detail ? (
            <div className="fm-body">
              <section className="fm-section">
                <h3 className="fm-section-title">User information</h3>
                <div className="fm-card fm-user">
                  <div className="fm-avatar">{detail.user.initials}</div>
                  <div>
                    <h4>{detail.user.name}</h4>
                    <small>Email: {detail.user.email}</small>
                    <small>Student number: {detail.user.studentNumber}</small>
                    <small>Course: {detail.user.course}</small>
                    {detail.user.yearSection !== "—" ? (
                      <small>Year and section: {detail.user.yearSection}</small>
                    ) : null}
                  </div>
                  <div className="fm-role-panel">
                    <div className="fm-role-block">
                      <span className="fm-role-kicker">Organization</span>
                      <span className="fm-role-org">{detail.user.organization}</span>
                    </div>
                    <div className="fm-role-block">
                      <span className="fm-role-kicker">Role</span>
                      <span className="fm-role-badge">
                        <span className="fm-role-badge-text">{detail.user.role}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="fm-section">
                <h3 className="fm-section-title">Rating & feedback</h3>
                <div className="fm-rating-grid">
                  <div className="fm-rating-box">
                    {detail.rating ? (
                      <>
                        <StarRating filled={detail.rating} size="lg" />
                        <div className="score">
                          {detail.rating}
                          <small>/{detail.ratingOutOf}</small>
                        </div>
                      </>
                    ) : (
                      <p className="admin-muted">No rating provided</p>
                    )}
                  </div>
                  <div className="fm-comment-box">
                    <strong>Comment</strong>
                    <p>{detail.comment || "—"}</p>
                  </div>
                </div>
              </section>

              <section className="fm-section">
                <h3 className="fm-section-title">Event details</h3>
                <div className="fm-card fm-row-grid">
                  <div className="fm-ev-cell">
                    <strong>Category</strong>
                    <span className="fm-ev-val">{detail.event.categoryLabel}</span>
                  </div>
                  <div className="fm-ev-cell">
                    <strong>Event name</strong>
                    <span className="fm-ev-val">{detail.event.name}</span>
                  </div>
                  <div className="fm-ev-cell">
                    <strong>Location</strong>
                    <span className="fm-ev-val">{detail.event.location}</span>
                  </div>
                  <div className="fm-ev-cell">
                    <strong>Date</strong>
                    <span className="fm-ev-val">{detail.event.date}</span>
                  </div>
                </div>
              </section>

              {detail.adminNotes.length > 0 ? (
                <section className="fm-section">
                  <h3 className="fm-section-title">Previous admin notes</h3>
                  <div className="fm-card">
                    <ul>
                      {detail.adminNotes.map((adminNote) => (
                        <li key={adminNote.id}>
                          {adminNote.text}
                          <small> · {adminNote.createdAt}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              <section className="fm-section">
                <h3 className="fm-section-title">Admin actions</h3>
                <div className="fm-actions">
                  {detail.certificateId ? (
                    <button
                      className="fm-btn-soft"
                      id="viewCertCopyBtn"
                      type="button"
                      onClick={() => showStatus(`Certificate ID: ${detail.certificateId}`)}
                    >
                      View original e-certificate
                    </button>
                  ) : null}
                  <button
                    className="fm-btn-soft"
                    id="downloadFeedbackPdfBtn"
                    type="button"
                    onClick={() => {
                      downloadFeedbackText(detail);
                      showStatus("Feedback report downloaded");
                    }}
                  >
                    Download report
                  </button>
                  <a
                    className="fm-btn-soft"
                    id="followUpEmailBtn"
                    href={`mailto:${encodeURIComponent(detail.user.email)}?subject=${encodeURIComponent(`Re: Feedback for ${detail.event.name}`)}&body=${encodeURIComponent(`Hi ${detail.user.name},\n\nRegarding your feedback:\n\n${detail.comment}\n\n`)}`}
                    onClick={() => showStatus("Opening email client")}
                  >
                    Send follow-up email
                  </a>
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
                      disabled={saving}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                      className="fm-send"
                      id="feedbackSendNoteBtn"
                      type="button"
                      disabled={saving}
                      onClick={() => void sendAdminNote()}
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
                    disabled={saving}
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
                    disabled={saving}
                    onClick={() => void saveStatus()}
                  >
                    {saving ? "Saving…" : "Change status"}
                  </button>
                </div>
              </section>

              <p className="fm-submitted">Submitted on {detail.submittedAt}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
