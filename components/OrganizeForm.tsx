"use client";

import { useEffect, useRef, useState } from "react";

type ReviewDetails = {
  eventName: string;
  eventDate: string;
  venue: string;
  courseOrganizer: string;
  school: string;
  department: string;
  startTime: string;
  endTime: string;
  eventType: string;
  duration: string;
  minAttendance: string;
};

const emptyReviewDetails: ReviewDetails = {
  eventName: "",
  eventDate: "",
  venue: "",
  courseOrganizer: "",
  school: "",
  department: "",
  startTime: "",
  endTime: "",
  eventType: "",
  duration: "",
  minAttendance: "",
};

export function OrganizeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const courseRef = useRef<HTMLSelectElement>(null);
  const orgRef = useRef<HTMLInputElement>(null);
  const combinedRef = useRef<HTMLInputElement>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewDetails, setReviewDetails] = useState<ReviewDetails>(emptyReviewDetails);

  useEffect(() => {
    function syncCombined() {
      const course = courseRef.current;
      const org = orgRef.current;
      const combined = combinedRef.current;
      if (!course || !org || !combined) return;
      const c = (course.value || "").trim();
      const o = (org.value || "").trim().replace(/^[\s—-]+|[\s—-]+$/g, "");
      combined.value = c && o ? `${c}-${o}` : c || o || "";
    }

    const course = courseRef.current;
    const org = orgRef.current;
    if (!course || !org) return;

    course.addEventListener("change", syncCombined);
    org.addEventListener("input", syncCombined);
    syncCombined();
    return () => {
      course.removeEventListener("change", syncCombined);
      org.removeEventListener("input", syncCombined);
    };
  }, []);

  const getFormValue = (formData: FormData, key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
  };

  const handleReview = () => {
    if (combinedRef.current && courseRef.current && orgRef.current) {
      const course = (courseRef.current.value || "").trim();
      const org = (orgRef.current.value || "").trim().replace(/^[\s—-]+|[\s—-]+$/g, "");
      combinedRef.current.value = course && org ? `${course}-${org}` : course || org || "";
    }

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    setReviewDetails({
      eventName: getFormValue(formData, "event_name"),
      eventDate: getFormValue(formData, "event_date"),
      venue: getFormValue(formData, "venue"),
      courseOrganizer: getFormValue(formData, "course_organizer_combined"),
      school: getFormValue(formData, "school"),
      department: getFormValue(formData, "department"),
      startTime: getFormValue(formData, "start_time"),
      endTime: getFormValue(formData, "end_time"),
      eventType: getFormValue(formData, "event_type"),
      duration: getFormValue(formData, "duration"),
      minAttendance: getFormValue(formData, "min_attendance"),
    });
    setShowReview(true);
  };

  return (
    <form ref={formRef} className="organize-form-shell" action="#" method="post" aria-label="Create new event">
      <label className="form-section-label" htmlFor="event-name">
        Event Name
      </label>
      <div className="form-panel">
        <div className="field-event-name">
          <input
            className="input-text"
            id="event-name"
            name="event_name"
            type="text"
            placeholder="Enter event name"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-flow">
          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
              </svg>
              Date:
            </span>
            <input className="input-inline" type="date" name="event_date" />
          </div>

          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path
                  d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
              Venue:
            </span>
            <input className="input-inline" type="text" name="venue" placeholder="Location" />
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 4h14v16H5V4z" strokeLinejoin="round" />
                <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="9" r="4" />
                <path d="M6 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
              </svg>
              Course &amp; Requesting Organizer:
            </span>
            <div className="course-org-inputs">
              <select
                ref={courseRef}
                className="input-inline"
                id="course-code"
                name="course_code"
                aria-label="Course program"
                defaultValue=""
              >
                <option value="">Select course</option>
                <option value="BSIT">BSIT — BS Information Technology</option>
                <option value="BMMA">BMMA — Bachelor of Multimedia Arts</option>
                <option value="BACOMM">BACOMM — BA Communication</option>
                <option value="BSRT">BSRT — BS Radiologic Technology</option>
                <option value="BSPT">BSPT — BS Physical Therapy</option>
                <option value="BSBIO">BSB — BS Biology</option>
                <option value="BSPHARMA">BSPh — BS Pharmacy</option>
                <option value="BSA">BSA — BS Accountancy</option>
                <option value="BSBA">BSBA — BS Business Administration</option>
                <option value="BSHM">BSHM — BS Hospitality Management</option>
                <option value="BSTM">BSTM — BS Tourism Management</option>
                <option value="BSN">BSN — BS Nursing</option>
                <option value="BSMT">BSMT — BS Medical Technology</option>
                <option value="BSED">BSED — Bachelor of Secondary Education</option>
                <option value="BEED">BEED — Bachelor of Elementary Education</option>
              </select>
              <span className="course-org-sep" aria-hidden>
                —
              </span>
              <input
                ref={orgRef}
                className="input-inline"
                id="organizer-name"
                name="organizer_name"
                type="text"
                placeholder="Org name e.g. DOMINIXODE"
                autoComplete="organization"
                aria-label="Requesting organizer or organization name"
              />
            </div>
            <span className="muted-hint">
              Displays together as <strong>BSIT-DOMINIXODE</strong> (course code + organizer).
            </span>
            <input ref={combinedRef} type="hidden" id="course-organizer-combined" name="course_organizer_combined" defaultValue="" />
          </div>

          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 21V8l8-4 8 4v13" strokeLinejoin="round" />
                <path d="M4 12h16M9 12v9M15 12v9" strokeLinejoin="round" />
              </svg>
              School:
            </span>
            <select className="input-inline" name="school" defaultValue="">
              <option value="">Select school</option>
              <option value="main">Main campus</option>
              <option value="annex">Annex</option>
            </select>
          </div>

          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h6v10H4V7zm10 3h6v7h-6v-7zM4 20h16v2H4v-2z" strokeLinejoin="round" />
              </svg>
              Department:
            </span>
            <select className="input-inline" name="department" aria-label="Department" defaultValue="">
              <option value="">Select department</option>
              <option value="SASE">SASE</option>
              <option value="SCMCS">SCMCS</option>
              <option value="SIHTM">SIHTM</option>
              <option value="SMLS">SMLS</option>
              <option value="SNAHS">SNAHS</option>
            </select>
          </div>

          <div className="form-row form-row--span2">
            <div className="time-pair">
              <div className="form-row">
                <span className="form-row__label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l3 2" strokeLinecap="round" />
                  </svg>
                  Start Time:
                </span>
                <div className="time-row">
                  <input type="time" name="start_time" />
                </div>
              </div>
              <div className="form-row">
                <span className="form-row__label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l3 2" strokeLinecap="round" />
                  </svg>
                  End Time:
                </span>
                <div className="time-row">
                  <input type="time" name="end_time" />
                </div>
              </div>
            </div>
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="9" cy="9" r="3" />
                <circle cx="15" cy="9" r="3" />
                <path d="M3 18c0-3 4-5 9-5s9 2 9 5" strokeLinecap="round" />
              </svg>
              Type of Event:
            </span>
            <input className="input-inline" type="text" name="event_type" placeholder="Workshop, seminar..." />
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6l4 2" strokeLinecap="round" />
              </svg>
              Total Time Duration:
            </span>
            <input className="input-inline" type="text" name="duration" placeholder="e.g. 3 hours" />
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Minimum Attendance Time Required:
            </span>
            <input
              className="input-inline"
              type="text"
              name="min_attendance"
              defaultValue="None / 0 Hours / TBA"
            />
            <span className="muted-hint">Edit as needed (None, 0 Hours, or TBA).</span>
          </div>
        </div>

        <div className="upload-grid">
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add Poster/Pubmat</span>
            <input type="file" name="poster" accept="image/*,.pdf" />
          </label>
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add Registration Form</span>
            <input type="file" name="registration" accept=".pdf,.doc,.docx" />
          </label>
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add Survey Form</span>
            <input type="file" name="survey" accept=".pdf,.doc,.docx" />
          </label>
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add E-Certificate Template</span>
            <input type="file" name="certificate_template" accept=".pdf,.doc,.docx" />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-review" onClick={handleReview}>
            Review
          </button>
          <button type="submit" className="btn-submit">
            Submit
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
              <path
                d="M8 12l2.5 3L16 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {showReview && (
          <div className="review-overlay">
            <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
              <div className="review-modal__header">
                <h2 id="review-modal-title">Review Event Details</h2>
                <button className="review-modal__close" type="button" aria-label="Close review" onClick={() => setShowReview(false)}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <dl className="review-list">
                <div>
                  <dt>Event Name</dt>
                  <dd>{reviewDetails.eventName}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{reviewDetails.eventDate}</dd>
                </div>
                <div>
                  <dt>Venue</dt>
                  <dd>{reviewDetails.venue}</dd>
                </div>
                <div>
                  <dt>Course &amp; Organizer</dt>
                  <dd>{reviewDetails.courseOrganizer}</dd>
                </div>
                <div>
                  <dt>School</dt>
                  <dd>{reviewDetails.school}</dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>{reviewDetails.department}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>
                    {reviewDetails.startTime} to {reviewDetails.endTime}
                  </dd>
                </div>
                <div>
                  <dt>Type of Event</dt>
                  <dd>{reviewDetails.eventType}</dd>
                </div>
                <div>
                  <dt>Total Duration</dt>
                  <dd>{reviewDetails.duration}</dd>
                </div>
                <div>
                  <dt>Minimum Attendance</dt>
                  <dd>{reviewDetails.minAttendance}</dd>
                </div>
              </dl>

              <div className="review-modal__actions">
                <button className="btn-review" type="button" onClick={() => setShowReview(false)}>
                  Edit
                </button>
                <button className="btn-submit" type="submit">
                  Submit
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
                    <path
                      d="M8 12l2.5 3L16 10"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </form>
  );
}
