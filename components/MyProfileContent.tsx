"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAuthSession, fetchEvents, fetchProfile, readAuthSession, type UserEvent, type UserProfile } from "@/lib/user-api";

export function MyProfileContent() {
  const [tab, setTab] = useState<"attended" | "organized" | "certs">("organized");
  const [sortAsc, setSortAsc] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(() => readAuthSession()?.user || null);
  const [profileError, setProfileError] = useState("");
  const [organizedEvents, setOrganizedEvents] = useState<UserEvent[]>([]);

  useEffect(() => {
    const session = readAuthSession();
    if (!session?.token) {
      setProfileError("No active session found. Please login again.");
      return;
    }
    fetchProfile(session.token)
      .then((response) => {
        setProfile(response.profile);
        setProfileError("");
        window.localStorage.setItem("dcspace_auth", JSON.stringify({ token: session.token, user: response.profile }));
        return fetchEvents(undefined, { status: "all", submittedByEmail: response.profile.email });
      })
      .then((response) => {
        if (response) {
          setOrganizedEvents(response.events);
        }
      })
      .catch((error) => {
        setProfileError(error instanceof Error ? error.message : "Failed to load profile details.");
      });
  }, []);

  const initials = `${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="main--profile">
      <header className="profile-page-header">
        <h1 className="profile-page-header__title">My Profile</h1>
        <div className="profile-page-header__tools">
          <Link
            className="profile-logout"
            href="/login"
            onClick={() => {
              clearAuthSession();
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
            <span className="profile-summary__initials">{initials}</span>
          </div>
          <div className="profile-summary__fields">
            <p className="profile-summary__name">{profile?.fullName || "Full Name"}</p>
            <p className="profile-summary__line">
              <span>Student Number:</span> {profile?.studentNumber || "2024-01452"}
            </p>
            <p className="profile-summary__line">
              <span>RFID Tag No.:</span> {profile?.rfidNumber || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Email:</span> {profile?.email || "No email on file"}
            </p>
            <p className="profile-summary__line">
              <span>Course:</span> {profile?.course || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>School:</span> {profile?.school || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Organization/Club:</span> {profile?.organizationPart || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Position:</span> {profile?.organizationRole || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Account Type:</span> {profile?.role ? `${profile.role} account` : "student account"}
            </p>
            {profileError && <p className="auth-field-error">{profileError}</p>}
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
            Events Organized ({organizedEvents.length})
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
                {tab === "organized" ? (
                  organizedEvents.length > 0 ? (
                    organizedEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{event.title}</td>
                        <td>{event.date || "N/A"}</td>
                        <td>
                          <span className="profile-table__status">{event.status || "pending"}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>No organized events yet.</td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td>Event Name</td>
                    <td>MM/DD/YYYY</td>
                    <td>
                      <span className="profile-table__status">Upcoming</span>
                    </td>
                  </tr>
                )}
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
