"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type RegisteredEvent = {
  month: string;
  day: string;
  year: string;
  name: string;
  dateTime: string;
  venue: string;
  organizer: string;
};

type OrganizedEvent = {
  name: string;
  date: string;
  status: string;
  certificate: string;
};

const registeredEvents: RegisteredEvent[] = [
  {
    month: "March",
    day: "15",
    year: "2026",
    name: "Name of Event",
    dateTime: "Event Time Start and End",
    venue: "Event Venue",
    organizer: "Event Organizer",
  },
  {
    month: "April",
    day: "23",
    year: "2026",
    name: "Name of Event",
    dateTime: "Event Time Start and End",
    venue: "Event Venue",
    organizer: "Event Organizer",
  },
  {
    month: "March",
    day: "15",
    year: "2026",
    name: "Name of Event",
    dateTime: "Event Time Start and End",
    venue: "Event Venue",
    organizer: "Event Organizer",
  },
];

const organizedEvents: OrganizedEvent[] = [
  {
    name: "Event Name",
    date: "Date",
    status: "Reviewed/Ongoing/Passed",
    certificate: "Processing/Reviewing/Issued",
  },
];

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
      month: event.month,
      day: event.day,
      year: event.year,
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

export function DashboardPageContent() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(true);
  const [activeDashboardView, setActiveDashboardView] = useState<"registered" | "organized">("registered");
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

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
    [],
  );

  const handleAccept = () => {
    if (!consentChecked) {
      setShowValidation(true);
      return;
    }

    setShowPrivacyModal(false);
    setShowValidation(false);
  };

  const handleCancel = () => {
    setConsentChecked(false);
    setShowValidation(false);
    setShowPrivacyModal(false);
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
                {registeredEventsBySection.map((section) => (
                  section.events.length > 0 && (
                    <section className="registered-group" key={section.key} aria-labelledby={`${section.key}-events-title`}>
                      <h2 className="registered-group-title" id={`${section.key}-events-title`}>
                        {section.title}
                      </h2>
                      <div className="registered-grid">
                        {section.events.map((event, index) => (
                          <Link className="registered-card" href={getRegisteredEventDetailsHref(event)} key={`${section.key}-${event.name}-${index}`}>
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
                  )
                ))}
              </section>
            ) : (
              <DashboardEmptyState message="No registered events found. Browse the Events tab and select an event to register." />
            )
          ) : (
            organizedEvents.length > 0 ? (
              <section className="organized-table" aria-label="Organized events">
                <div className="organized-row organized-header">
                  <span>Event Name</span>
                  <span>Date</span>
                  <span>Event Status</span>
                  <span>E-Certificate</span>
                  <span aria-hidden="true" />
                </div>

                {organizedEvents.map((event, index) => (
                  <div className="organized-row" key={`${event.name}-${index}`}>
                    <span>{event.name}</span>
                    <span>{event.date}</span>
                    <span>{event.status}</span>
                    <span>{event.certificate}</span>
                    <button className="details-button" type="button">
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
                    </button>
                  </div>
                ))}
              </section>
            ) : (
              <DashboardEmptyState message="No organized events yet. If you would like to create or manage an event, click the plus button." />
            )
          )}
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

              {showValidation && (
                <p className="validation-text">
                  Please check the consent box before continuing.
                </p>
              )}

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

function DashboardEmptyState({ message }: { message: string }) {
  return (
    <div className="dashboard-empty">
      <svg className="dashboard-empty-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 4H17V2H15V4H9V2H7V4H5C3.897 4 3 4.897 3 6V20C3 21.103 3.897 22 5 22H19C20.103 22 21 21.103 21 20V6C21 4.897 20.103 4 19 4ZM14.412 19L11.963 17.712L9.514 19L9.982 16.272L8 14.342L10.738 13.944L11.963 11.464L13.188 13.944L15.926 14.342L13.945 16.273L14.412 19ZM19 9H5V7H19V9Z"
          fill="currentColor"
        />
      </svg>
      <p>{message}</p>
    </div>
  );
}
