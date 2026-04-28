"use client";

import Link from "next/link";
import { useState } from "react";
import { signOutAttendanceUser } from "@/lib/attendance";

export function MyProfileContent() {
  const [tab, setTab] = useState<"attended" | "organized" | "certs">("organized");
  const [sortAsc, setSortAsc] = useState(true);

  return (
    <div className="main--profile">
      <header className="profile-page-header">
        <h1 className="profile-page-header__title">My Profile</h1>
        <div className="profile-page-header__tools">
          <Link
            className="profile-logout"
            href="/login"
            onClick={() => {
              signOutAttendanceUser();
              window.sessionStorage.removeItem("dcspacePrivacySeen");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 2v10" />
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            </svg>
            Log out
          </Link>
        </div>
      </header>

      <div className="profile-page__inner">
        <div className="profile-hero-strip">
          <hr className="profile-hero-strip__rule" />
        </div>

        <section className="profile-summary" aria-labelledby="profile-summary-heading">
          <h2 id="profile-summary-heading" className="visually-hidden">
            Profile summary
          </h2>
          <div className="profile-summary__photo" aria-hidden>
            <span className="profile-summary__initials">FN</span>
          </div>
          <div className="profile-summary__fields">
            <p className="profile-summary__name">Full Name</p>
            <p className="profile-summary__line">
              <span>Student Number:</span> 2024-01452
            </p>
            <p className="profile-summary__line">
              <span>Course &amp; Section:</span> BSIT 4A
            </p>
            <p className="profile-summary__line">
              <span>School:</span> SNAHS
            </p>
            <p className="profile-summary__line">
              <span>Organization/Club:</span> DC Space Guild
            </p>
          </div>
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Profile sections">
          <button
            type="button"
            className={`profile-tab${tab === "attended" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "attended"}
            onClick={() => setTab("attended")}
          >
            Events Attended (3)
          </button>
          <button
            type="button"
            className={`profile-tab${tab === "organized" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "organized"}
            onClick={() => setTab("organized")}
          >
            Events Organized (5)
          </button>
          <button
            type="button"
            className={`profile-tab${tab === "certs" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "certs"}
            onClick={() => setTab("certs")}
          >
            Certificates (2)
          </button>
        </div>

        <div className="profile-panel">
          <div className="profile-table-wrap">
            <table className="profile-table">
              <thead>
                <tr>
                  <th scope="col">Event Name</th>
                  <th scope="col">Date</th>
                  <th scope="col">Event Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Event Name</td>
                  <td>MM/DD/YYYY</td>
                  <td>
                    <span className="profile-table__status">Upcoming</span>
                  </td>
                </tr>
                <tr>
                  <td>Event Name</td>
                  <td>MM/DD/YYYY</td>
                  <td>
                    <span className="profile-table__status profile-table__status--ongoing">Ongoing</span>
                  </td>
                </tr>
                <tr>
                  <td>Event Name</td>
                  <td>MM/DD/YYYY</td>
                  <td>
                    <span className="profile-table__status profile-table__status--past">Past</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="profile-panel__footer">
            <div className="profile-sort" role="group" aria-label="Sort order">
              <button
                type="button"
                className={`profile-sort__btn${sortAsc ? " is-active" : ""}`}
                aria-pressed={sortAsc}
                onClick={() => setSortAsc(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10l4-4 4 4M16 14l-4 4-4-4" />
                </svg>
                Ascending
              </button>
              <button
                type="button"
                className={`profile-sort__btn${!sortAsc ? " is-active" : ""}`}
                aria-pressed={!sortAsc}
                onClick={() => setSortAsc(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l4 4 4-4M16 10l-4-4-4 4" />
                </svg>
                Descending
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
