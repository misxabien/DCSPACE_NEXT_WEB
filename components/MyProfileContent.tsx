"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { canOrganizeEvents, readOrganizedEvents } from "@/lib/dc-events";
import type { RegisteredEvent } from "@/lib/attendance";
import {
  getCertificateStatus,
  getCurrentAttendanceUser,
  getEventStatus,
  getRegisteredEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
  signOutAttendanceUser,
  formatEventDate,
} from "@/lib/attendance";

type ProfileTab = "attended" | "organized" | "certs";
type EditProfileResult = "saved" | "approval";

const profileColorPairs = [
  { cover: "#8DB6F5", photo: "#F5E8C8" },
  { cover: "#B6D9C6", photo: "#F2D2B6" },
  { cover: "#F0DDAC", photo: "#A9C7FF" },
  { cover: "#D9C3F4", photo: "#F7E7A8" },
  { cover: "#F4B8A8", photo: "#B8D9F4" },
];

function getEventDateTime(event: RegisteredEvent) {
  const parsedDate = new Date(`${event.month || ""} ${event.day || ""}, ${event.year || ""}`);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function getInitials(firstName?: string, lastName?: string, fallback?: string) {
  const firstInitial = firstName?.trim().charAt(0) || "";
  const lastInitial = lastName?.trim().charAt(0) || "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || fallback?.trim().slice(0, 2).toUpperCase() || "DC";
}

function getProfileColors(seed: string) {
  const hash = seed.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  return profileColorPairs[hash % profileColorPairs.length];
}

function getDisplayValue(value?: string) {
  return value && value !== "Not provided" ? value : "Not available";
}

export function MyProfileContent() {
  const [tab, setTab] = useState<ProfileTab>("attended");
  const [sortAsc, setSortAsc] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileClosing, setEditProfileClosing] = useState(false);
  const [editProfileResult, setEditProfileResult] = useState<EditProfileResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackClosing, setFeedbackClosing] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [canViewOrganizedEvents, setCanViewOrganizedEvents] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getCurrentAttendanceUser> | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<ReturnType<typeof readRegisteredEvents>>([]);
  const [organizedEvents, setOrganizedEvents] = useState<RegisteredEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, ReturnType<typeof readUserAttendanceRecords>[string]>>({});
  const [profilePhotoColor, setProfilePhotoColor] = useState("");
  const [profilePhotoImage, setProfilePhotoImage] = useState("");
  const [profileCoverColor, setProfileCoverColor] = useState("");
  const [profileCoverImage, setProfileCoverImage] = useState("");
  const [draftPhotoColor, setDraftPhotoColor] = useState("");
  const [draftPhotoImage, setDraftPhotoImage] = useState("");
  const [draftCoverColor, setDraftCoverColor] = useState("");
  const [draftCoverImage, setDraftCoverImage] = useState("");
  const [draftOrganization, setDraftOrganization] = useState("");
  const [draftRole, setDraftRole] = useState("");

  useEffect(() => {
    const refreshProfile = () => {
      const currentUser = getCurrentAttendanceUser();
      const canOrganize = canOrganizeEvents();

      setUser(currentUser);
      setRegisteredEvents(readRegisteredEvents());
      setAttendanceRecords(readUserAttendanceRecords(currentUser));
      setCanViewOrganizedEvents(canOrganize);
      setOrganizedEvents(canOrganize ? readOrganizedEvents() : []);
      setProfilePhotoColor(window.localStorage.getItem("dcspaceProfilePhotoColor") || "");
      setProfilePhotoImage(window.localStorage.getItem("dcspaceProfilePhotoImage") || "");
      setProfileCoverColor(window.localStorage.getItem("dcspaceProfileCoverColor") || "");
      setProfileCoverImage(window.localStorage.getItem("dcspaceProfileCoverImage") || "");
    };

    refreshProfile();
    window.addEventListener("pageshow", refreshProfile);
    window.addEventListener("storage", refreshProfile);
    window.addEventListener("dcspace-events-updated", refreshProfile);
    window.addEventListener("dcspace-registered-events-updated", refreshProfile);

    return () => {
      window.removeEventListener("pageshow", refreshProfile);
      window.removeEventListener("storage", refreshProfile);
      window.removeEventListener("dcspace-events-updated", refreshProfile);
      window.removeEventListener("dcspace-registered-events-updated", refreshProfile);
    };
  }, []);

  useEffect(() => {
    if (!canViewOrganizedEvents && tab === "organized") {
      setTab("attended");
    }
  }, [canViewOrganizedEvents, tab]);

  const attendedEvents = useMemo(() => {
    return registeredEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      return attendanceRecords[eventId];
    });
  }, [attendanceRecords, registeredEvents]);

  const certificateEvents = useMemo(() => {
    return attendedEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      const record = attendanceRecords[eventId];
      return getCertificateStatus(record) === "Download";
    });
  }, [attendanceRecords, attendedEvents]);

  const visibleEvents = useMemo(() => {
    const events =
      tab === "attended"
        ? attendedEvents
        : tab === "certs"
        ? certificateEvents
        : organizedEvents;

    return [...events].sort((firstEvent, secondEvent) => {
      const firstTime = getEventDateTime(firstEvent);
      const secondTime = getEventDateTime(secondEvent);

      return sortAsc ? firstTime - secondTime : secondTime - firstTime;
    });
  }, [attendedEvents, certificateEvents, organizedEvents, sortAsc, tab]);

  const fullName = `${getDisplayValue(user?.firstName)} ${getDisplayValue(user?.lastName)}`.replace(/Not available/g, "").trim() || "Student Account";
  const initials = getInitials(user?.firstName, user?.lastName, user?.studentEmail);
  const profileColors = getProfileColors(`${fullName}${user?.studentNumber || ""}`);
  const activeProfileColors = {
    cover: profileCoverColor || profileColors.cover,
    photo: profilePhotoColor || profileColors.photo,
  };

  const handleOpenEditProfile = () => {
    setDraftPhotoColor(profilePhotoColor || profileColors.photo);
    setDraftPhotoImage(profilePhotoImage);
    setDraftCoverColor(profileCoverColor || profileColors.cover);
    setDraftCoverImage(profileCoverImage);
    setDraftOrganization(user?.organizationPart || "");
    setDraftRole(user?.organizationRole || "Organization Member");
    setEditProfileResult(null);
    setEditProfileClosing(false);
    setShowEditProfile(true);
  };

  const handleCloseEditProfile = () => {
    setEditProfileClosing(true);
    window.setTimeout(() => {
      setShowEditProfile(false);
      setEditProfileClosing(false);
      setEditProfileResult(null);
    }, 220);
  };

  const handleChangePhotoImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftPhotoImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangeCoverImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditProfile = () => {
    const organizationChanged = draftOrganization.trim() !== (user?.organizationPart || "").trim();
    const roleChanged = draftRole !== (user?.organizationRole || "Organization Member");

    window.localStorage.setItem("dcspaceProfilePhotoColor", draftPhotoColor);
    window.localStorage.setItem("dcspaceProfileCoverColor", draftCoverColor);
    if (draftPhotoImage) {
      window.localStorage.setItem("dcspaceProfilePhotoImage", draftPhotoImage);
    } else {
      window.localStorage.removeItem("dcspaceProfilePhotoImage");
    }
    if (draftCoverImage) {
      window.localStorage.setItem("dcspaceProfileCoverImage", draftCoverImage);
    } else {
      window.localStorage.removeItem("dcspaceProfileCoverImage");
    }
    setProfilePhotoColor(draftPhotoColor);
    setProfilePhotoImage(draftPhotoImage);
    setProfileCoverColor(draftCoverColor);
    setProfileCoverImage(draftCoverImage);

    if (organizationChanged || roleChanged) {
      window.localStorage.setItem(
        "dcspacePendingProfileOrganizationChange",
        JSON.stringify({
          organizationPart: draftOrganization.trim(),
          organizationRole: draftRole,
          submittedAt: new Date().toISOString(),
        }),
      );
      setEditProfileResult("approval");
      return;
    }

    setEditProfileResult("saved");
  };

  const handleOpenFeedback = () => {
    setFeedbackRating(0);
    setFeedbackClosing(false);
    setShowFeedback(true);
  };

  const handleCloseFeedback = () => {
    setFeedbackClosing(true);
    window.setTimeout(() => {
      setShowFeedback(false);
      setFeedbackClosing(false);
    }, 220);
  };

  return (
    <div className="main--profile">
      <div className={`profile-content${showFeedback || showEditProfile ? " is-feedback-open" : ""}`}>
        <section className={`profile-cover${profileCoverImage ? " has-cover-image" : ""}`} style={{ "--profile-cover-color": activeProfileColors.cover } as CSSProperties}>
          {profileCoverImage && <Image className="profile-cover__image" src={profileCoverImage} alt="" fill unoptimized />}
          <h1 className="visually-hidden">My Profile</h1>
          {!profileCoverImage && (
            <span className="profile-cover__initials" aria-hidden="true">
              {initials}
            </span>
          )}

          <Link
            className="profile-logout"
            href="/login"
            onClick={() => {
              signOutAttendanceUser();
              window.sessionStorage.removeItem("dcspacePrivacySeen");
            }}
          >
            Log Out
          </Link>

          <button className="profile-edit" type="button" onClick={handleOpenEditProfile}>
            Edit Profile
            <span className="profile-icon profile-icon--pencil-square" aria-hidden="true" />
          </button>
        </section>

        <div className="profile-page__inner">
          <aside className="profile-summary" aria-labelledby="profile-summary-heading">
            <div className="profile-summary__photo" style={{ "--profile-photo-color": activeProfileColors.photo } as CSSProperties} aria-hidden="true">
              {profilePhotoImage ? (
                <Image src={profilePhotoImage} alt="" width={100} height={100} unoptimized />
              ) : (
                <span className="profile-summary__initials">{initials}</span>
              )}
            </div>

            <div className="profile-summary__fields">
              <h2 id="profile-summary-heading" className="profile-summary__name">
                {fullName}
              </h2>
              <p className="profile-summary__email">{getDisplayValue(user?.studentEmail)}</p>

              <dl className="profile-details">
                <div>
                  <dt>Student Number:</dt>
                  <dd>{getDisplayValue(user?.studentNumber)}</dd>
                </div>
                <div>
                  <dt>Account Type:</dt>
                  <dd>Student</dd>
                </div>
                <div>
                  <dt>Course:</dt>
                  <dd>{getDisplayValue(user?.course)}</dd>
                </div>
                <div>
                  <dt>School:</dt>
                  <dd>{getDisplayValue(user?.school)}</dd>
                </div>
                <div>
                  <dt>Organization:</dt>
                  <dd>{getDisplayValue(user?.organizationPart)}</dd>
                </div>
                <div>
                  <dt>Role:</dt>
                  <dd className="profile-role">{getDisplayValue(user?.organizationRole)}</dd>
                </div>
              </dl>
            </div>
          </aside>

          <section className="profile-records" aria-label="Profile records">
            <div className="profile-records__top">
              <div className="profile-tabs" role="tablist" aria-label="Profile sections">
                <button
                  type="button"
                  className={`profile-tab${tab === "attended" ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={tab === "attended"}
                  onClick={() => setTab("attended")}
                >
                  Events Attended ({attendedEvents.length})
                </button>

                {canViewOrganizedEvents && (
                  <button
                    type="button"
                    className={`profile-tab${tab === "organized" ? " is-active" : ""}`}
                    role="tab"
                    aria-selected={tab === "organized"}
                    onClick={() => setTab("organized")}
                  >
                    Events Organized ({organizedEvents.length})
                  </button>
                )}

                <button
                  type="button"
                  className={`profile-tab${tab === "certs" ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={tab === "certs"}
                  onClick={() => setTab("certs")}
                >
                  Certificates ({certificateEvents.length})
                </button>
              </div>

              <button className="profile-feedback" type="button" onClick={handleOpenFeedback}>
                Submit a Feedback!
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
                    {visibleEvents.length > 0 ? (
                      visibleEvents.map((event) => (
                        <tr key={getRegisteredEventId(event)}>
                          <td>{event.name || "Event Name"}</td>
                          <td>{formatEventDate(event)}</td>
                          <td>
                            <span className="profile-table__status">
                              {getEventStatus(event)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>No records available yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="profile-panel__footer">
              <div className="profile-sort" role="group" aria-label="Sort order">
                <button
                  type="button"
                  className={`profile-sort__btn${sortAsc ? " is-active" : ""}`}
                  aria-pressed={sortAsc}
                  onClick={() => setSortAsc(true)}
                >
                  <Image src="/assets/ascending-arrow.svg" alt="" width={16} height={16} aria-hidden="true" />
                  Ascending
                </button>

                <button
                  type="button"
                  className={`profile-sort__btn${!sortAsc ? " is-active" : ""}`}
                  aria-pressed={!sortAsc}
                  onClick={() => setSortAsc(false)}
                >
                  <Image src="/assets/descending-arrow.svg" alt="" width={16} height={16} aria-hidden="true" />
                  Descending
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showEditProfile && (
        <div className={`edit-profile-overlay${editProfileClosing ? " is-closing" : ""}`}>
          <section className="edit-profile-modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
            <h2 id="edit-profile-title">Edit Profile</h2>

            {editProfileResult === null ? (
              <div className="edit-profile-form">
                <div className="edit-profile-visuals">
                  <div className="edit-profile-photo" style={{ "--edit-photo-color": draftPhotoColor } as CSSProperties}>
                    {draftPhotoImage ? (
                      <Image src={draftPhotoImage} alt="" width={88} height={88} unoptimized />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="edit-profile-cover-preview" style={{ "--edit-cover-color": draftCoverColor } as CSSProperties}>
                    {draftCoverImage ? (
                      <Image src={draftCoverImage} alt="" fill unoptimized />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </div>

                <div className="edit-profile-actions">
                  <label className="edit-profile-upload">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleChangePhotoImage(event.target.files?.[0])}
                    />
                  </label>
                  <label className="edit-profile-upload">
                    Change Cover Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleChangeCoverImage(event.target.files?.[0])}
                    />
                  </label>
                </div>

                <label className="edit-profile-field">
                  <span>Organization:</span>
                  <span className="edit-profile-input-wrap">
                    <input
                      type="text"
                      value={draftOrganization}
                      onChange={(event) => setDraftOrganization(event.target.value)}
                    />
                    <span className="profile-icon profile-icon--pencil" aria-hidden="true" />
                  </span>
                </label>

                <label className="edit-profile-field">
                  <span>Organization Role:</span>
                  <select value={draftRole} onChange={(event) => setDraftRole(event.target.value)}>
                    <option value="Organization Member">Organization Member</option>
                    <option value="Officer">Organization Officer</option>
                  </select>
                </label>

                <button className="edit-profile-save" type="button" onClick={handleSaveEditProfile}>
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="edit-profile-result">
                <span
                  className={`profile-icon ${
                    editProfileResult === "saved" ? "profile-icon--person-check" : "profile-icon--send-check"
                  }`}
                  aria-hidden="true"
                />
                <p>
                  {editProfileResult === "saved"
                    ? "Profile changes saved successfully."
                    : "Profile changes submitted for admin approval."}
                </p>
                {editProfileResult === "approval" && <small>Check notifications for any updates.</small>}
                <button type="button" onClick={handleCloseEditProfile}>
                  Close
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {showFeedback && (
        <div className={`feedback-overlay${feedbackClosing ? " is-closing" : ""}`}>
          <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <button className="feedback-close" type="button" aria-label="Close feedback form" onClick={handleCloseFeedback}>
              x
            </button>

            <h2 id="feedback-title">We&apos;d Love to Hear From You</h2>
            <p className="feedback-subtitle">How was your experience? Let us know your thoughts.</p>

            <form
              className="feedback-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleCloseFeedback();
              }}
            >
              <label className="feedback-label">
                Event Name/Topic/Issue:
                <input type="text" name="feedback_topic" aria-label="Event Name, Topic, or Issue" />
              </label>

              <div className="feedback-rating">
                <span>Rating:</span>
                <div className="feedback-stars" aria-label="Rating stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button
                      type="button"
                      className={index < feedbackRating ? "is-selected" : ""}
                      aria-label={`Rate ${index + 1} star${index === 0 ? "" : "s"}`}
                      aria-pressed={index < feedbackRating}
                      key={index}
                      onClick={() => setFeedbackRating(index + 1)}
                    >
                      <span className={`profile-icon ${index < feedbackRating ? "profile-icon--star-fill" : "profile-icon--star"}`} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              <label className="feedback-label">
                Detailed Comment (optional)
                <textarea name="feedback_comment" aria-label="Detailed Comment" />
              </label>

              <button className="feedback-submit" type="submit">
                Submit
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
