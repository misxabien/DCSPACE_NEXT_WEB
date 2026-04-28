"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { fetchEvents, readAuthSession, type UserEvent } from "@/lib/user-api";

type RegisteredEvent = {
  id?: string;
  month: string;
  day: string;
  year: string;
  name: string;
  dateTime: string;
  venue: string;
  organizer: string;
};

const registeredEventsStorageKey = "dcspace_registered_events";

const registeredEventSections = [
  { key: "today", title: "Today's Event" },
  { key: "upcoming", title: "Upcoming Event" },
  { key: "passed", title: "Passed Event" },
] as const;

type RegisteredEventSectionKey = (typeof registeredEventSections)[number]["key"];

function getRegisteredEventDate(event: RegisteredEvent) {
  const parsedDate = new Date(`${event.month} ${event.day}, ${event.year}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

function getRegisteredEventSection(event: RegisteredEvent): RegisteredEventSectionKey {
  const eventDate = getRegisteredEventDate(event);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!eventDate || eventDate.getTime() === today.getTime()) {
    return "today";
  }

  return eventDate > today ? "upcoming" : "passed";
}

function getRegisteredEventDetailsHref(event: RegisteredEvent) {
  return {
    pathname: "/dashboard/registered-event",
    query: {
      eventId: event.id || "",
      month: event.month,
      day: event.day,
      year: event.year,
      title: event.name,
      date: event.dateTime,
      venue: event.venue,
      organizer: event.organizer,
    },
  };
}

function sortRegisteredEventsByDate(events: RegisteredEvent[], direction: "ascending" | "descending") {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstDate = getRegisteredEventDate(firstEvent)?.getTime() ?? 0;
    const secondDate = getRegisteredEventDate(secondEvent)?.getTime() ?? 0;

    return direction === "ascending" ? firstDate - secondDate : secondDate - firstDate;
  });
}

function toDateQueryFromIso(dateText: string) {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      month: "",
      day: "",
      year: "",
    };
  }

  return {
    month: parsedDate.toLocaleString("en-US", { month: "long" }),
    day: String(parsedDate.getDate()),
    year: String(parsedDate.getFullYear()),
  };
}

export function DashboardPageContent() {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeDashboardView, setActiveDashboardView] = useState<"registered" | "organized">("registered");
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [organizedEvents, setOrganizedEvents] = useState<UserEvent[]>([]);
  const [organizedError, setOrganizedError] = useState("");

  const isRegisteredView = activeDashboardView === "registered";

  const registeredEventsBySection = useMemo(
    () =>
      registeredEventSections.map((section) => {
        const sectionEvents = registeredEvents.filter((event) => getRegisteredEventSection(event) === section.key);

        return {
          ...section,
          events: sortRegisteredEventsByDate(sectionEvents, section.key === "passed" ? "descending" : "ascending"),
        };
      }),
    [registeredEvents],
  );

  useEffect(() => {
    setShowPrivacyModal(window.sessionStorage.getItem("dcspacePrivacySeen") !== "true");
  }, []);

  useEffect(() => {
    const readRegisteredEvents = () => {
      try {
        const byKey = new Map<string, RegisteredEvent>();

        const rawReg = window.localStorage.getItem(registeredEventsStorageKey);
        if (rawReg) {
          const parsed = JSON.parse(rawReg) as RegisteredEvent[];
          if (Array.isArray(parsed)) {
            for (const event of parsed) {
              const name = String(event?.name || "").trim().toLowerCase();
              if (!name.length || name === "event name") continue;
              const key = `${String(event.name)}|${String(event.dateTime)}`;
              byKey.set(key, event);
            }
          }
        }

        const rawBridge = window.localStorage.getItem("dcspaceRegisteredEvents");
        if (rawBridge) {
          const parsed = JSON.parse(rawBridge) as Array<Record<string, unknown>>;
          if (Array.isArray(parsed)) {
            for (const ev of parsed) {
              const name = String(ev.name || "").trim();
              if (!name || name.toLowerCase() === "event name") continue;
              const dateTime = String(ev.dateTime || "");
              const key = `${name}|${dateTime}`;
              if (byKey.has(key)) continue;
              byKey.set(key, {
                id: typeof ev.id === "string" ? ev.id : undefined,
                month: String(ev.month || ""),
                day: String(ev.day || ""),
                year: String(ev.year || ""),
                name,
                dateTime,
                venue: String(ev.venue || ""),
                organizer: String(ev.organizer || ""),
              });
            }
          }
        }

        setRegisteredEvents(Array.from(byKey.values()));
      } catch {
        setRegisteredEvents([]);
      }
    };

    readRegisteredEvents();
    const onFocus = () => readRegisteredEvents();
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
    };
  }, []);

  useEffect(() => {
    const session = readAuthSession();
    const email = session?.user?.email;
    if (!email) {
      setOrganizedEvents([]);
      return;
    }

    fetchEvents(undefined, { status: "all", submittedByEmail: email })
      .then((response) => {
        setOrganizedEvents(response.events);
        setOrganizedError("");
      })
      .catch((error) => {
        setOrganizedEvents([]);
        setOrganizedError(error instanceof Error ? error.message : "Failed to load organized events.");
      });
  }, []);

  const handleAccept = () => {
    if (!consentChecked) {
      setShowValidation(true);
      return;
    }

    setShowPrivacyModal(false);
    setShowValidation(false);
    window.sessionStorage.setItem("dcspacePrivacySeen", "true");
  };

  const handleCancel = () => {
    setConsentChecked(false);
    setShowValidation(false);
    setShowPrivacyModal(false);
    window.sessionStorage.setItem("dcspacePrivacySeen", "true");
  };

  return (
    <section className="dashboard-page">
      <div className={showPrivacyModal ? "dashboard-content dashboard-content--blurred" : "dashboard-content"}>
        <section className="dashboard-views">
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab${isRegisteredView ? " is-active" : ""}`}
              type="button"
              onClick={() => setActiveDashboardView("registered")}
            >
              Events Registered
            </button>
            <button
              className={`dashboard-tab${!isRegisteredView ? " is-active" : ""}`}
              type="button"
              onClick={() => setActiveDashboardView("organized")}
            >
              Events Organized
            </button>
          </div>

          {isRegisteredView ? (
            registeredEvents.length > 0 ? (
              <section className="registered-sections" aria-label="Registered events">
                {registeredEventsBySection.map(
                  (section) =>
                    section.events.length > 0 && (
                      <section className="registered-group" key={section.key} aria-labelledby={`${section.key}-events-title`}>
                        <h2 className="registered-group-title" id={`${section.key}-events-title`}>
                          {section.title}
                        </h2>

                        <div className="registered-grid">
                          {section.events.map((event, index) => (
                            <Link
                              className="registered-card"
                              href={getRegisteredEventDetailsHref(event)}
                              key={`${section.key}-${event.name}-${index}`}
                            >
                              <span className="registered-date">
                                <span>{event.month}</span>
                                <strong>{event.day}</strong>
                                <span>{event.year}</span>
                              </span>

                              <span className="registered-details">
                                <strong>{event.name}</strong>
                                <span>{event.dateTime}</span>
                                <span>{event.venue}</span>
                                <span>{event.organizer}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ),
                )}
              </section>
            ) : (
              <EmptyState message="No registered events found. Browse the Events tab and select an event to register. Once joined, your upcoming sessions will appear here." />
            )
          ) : organizedEvents.length > 0 ? (
            <section className="organized-table" aria-label="Organized events">
              <div className="organized-row organized-header">
                <span>Event Name</span>
                <span>Date</span>
                <span>Event Status</span>
                <span>E-Certificate</span>
                <span aria-hidden="true" />
              </div>

                {organizedEvents.map((event, index) => (
                  <div className="organized-row" key={`${event.id}-${index}`}>
                    <span>{event.title}</span>
                    <span>{event.date}</span>
                    <span>{event.status || "pending"}</span>
                    <span>{event.certificate || "Processing"}</span>
                    <Link
                      className="details-button"
                      href={{
                        pathname: "/dashboard/registered-event",
                        query: {
                          eventId: event.id,
                          ...toDateQueryFromIso(event.date),
                          title: event.title,
                          date: `${event.date}${event.startTime && event.endTime ? ` | ${event.startTime} - ${event.endTime}` : ""}`,
                          venue: event.venue,
                          organizer: event.requester || event.department || "DC Space",
                        },
                      }}
                    >
                      View Details
                      <svg viewBox="0 0 14 13" fill="none" aria-hidden="true">
                        <path
                          d="M0.262209 11.7641C-0.0942397 12.0519 -0.0861691 12.5132 0.281041 12.7935C0.646905 13.0739 1.23336 13.0675 1.58981 12.7787L8.73493 6.98223L8.0718 6.47548L8.73762 6.98329C9.09407 6.69341 9.086 6.23109 8.71745 5.95074C8.70669 5.94227 8.69593 5.93487 8.68516 5.92746L1.58847 0.220919C1.23202 -0.0678991 0.646905 -0.0742467 0.279695 0.206108C-0.0861691 0.486463 -0.0942397 0.946668 0.262209 1.23549L6.78052 6.47759L0.262209 11.7641Z"
                          fill="currentColor"
                        />
                        <path
                          d="M5.26221 11.7641C4.90576 12.0519 4.91383 12.5132 5.28104 12.7935C5.64691 13.0739 6.23336 13.0675 6.58981 12.7787L13.7349 6.98223L13.0718 6.47548L13.7376 6.98329C14.0941 6.69341 14.086 6.23109 13.7174 5.95074C13.7067 5.94227 13.6959 5.93487 13.6852 5.92746L6.58847 0.220919C6.23202 -0.0678991 5.64691 -0.0742467 5.2797 0.206108C4.91383 0.486463 4.90576 0.946668 5.26221 1.23549L11.7805 6.47759L5.26221 11.7641Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </section>
            ) : (
              <EmptyState message="No organized events yet. If you would like to create or manage an event, click the plus button." />
            )
          }
          {organizedError && <p className="auth-field-error">{organizedError}</p>}
        </section>
      </div>

      {showPrivacyModal && (
        <div className="privacy-overlay">
          <section className="privacy-card" aria-modal="true" role="dialog" aria-labelledby="privacy-modal-title">
            <header className="privacy-header">
              <h2 id="privacy-modal-title">Agreement &amp; Data Privacy</h2>
            </header>

            <div className="privacy-body">
              <div className="notice-row">
                <div className="notice-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M2 2H11.5V13H2V2Z" />
                    <path d="M2 17H22V21.5H2V17Z" />
                    <path d="M15.5 2H22V6H15.5V2Z" />
                    <path d="M15.5 9H22V13H15.5V9Z" />
                  </svg>
                </div>
                <h3 className="notice-title">Data Privacy Notice</h3>
              </div>

              <p className="notice-text">
                This application, DC Space, collects and processes your personal data to facilitate
                e-certificate issuance and attendance tracking. We are committed to protecting your privacy
                and will use your information only for account verification and event record management.
              </p>

              <h3 className="consent-title">Consent</h3>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(event) => setConsentChecked(event.target.checked)}
                />
                <span>
                  I have read and agree to the Data Privacy Notice and give my consent for the
                  collection and processing of my personal data.
                </span>
              </label>

              {showValidation && <p className="validation-text">Please check the consent box before continuing.</p>}

              <div className="privacy-actions">
                <button type="button" className="accept-button" onClick={handleAccept}>
                  Accept &amp; Continue
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}