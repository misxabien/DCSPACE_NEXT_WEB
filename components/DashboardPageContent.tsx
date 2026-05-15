'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import {
  canOrganizeEvents,
  type FrontendEvent,
  readOrganizedEvents,
  setSelectedBrowseEventId,
} from "@/lib/dc-events";

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

const registeredEventSections = [
  { key: 'today', title: "Today's Event" },
  { key: 'upcoming', title: 'Upcoming Event' },
  { key: 'passed', title: 'Passed Event' },
] as const;

type RegisteredEventSectionKey = (typeof registeredEventSections)[number]['key'];

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
    return 'today';
  }

  return eventDate > today ? 'upcoming' : 'passed';
}

function getRegisteredEventDetailsHref(event: RegisteredEvent) {
  return {
    pathname: '/dashboard/registered-event',
    query: {
      month: event.month,
      day: event.day,
      year: event.year,
    },
  };
}

function sortRegisteredEventsByDate(events: RegisteredEvent[], direction: 'ascending' | 'descending') {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstDate = getRegisteredEventDate(firstEvent)?.getTime() ?? 0;
    const secondDate = getRegisteredEventDate(secondEvent)?.getTime() ?? 0;

    return direction === 'ascending' ? firstDate - secondDate : secondDate - firstDate;
  });
}

export function DashboardPageContent() {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<FrontendEvent[]>([]);
  const [canViewOrganizedEvents, setCanViewOrganizedEvents] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeDashboardView, setActiveDashboardView] = useState<'registered' | 'organized'>('registered');
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const isRegisteredView = activeDashboardView === 'registered';

  const registeredEventsBySection = useMemo(
    () =>
      registeredEventSections.map((section) => {
        const sectionEvents = registeredEvents.filter((event) => getRegisteredEventSection(event) === section.key);

        return {
          ...section,
          events: sortRegisteredEventsByDate(sectionEvents, section.key === 'passed' ? 'descending' : 'ascending'),
        };
      }),
    [registeredEvents],
  );

  useEffect(() => {
    const refreshDashboardEvents = () => {
      const saved = JSON.parse(localStorage.getItem("dcspaceRegisteredEvents") || "[]");
      const requestedView = window.sessionStorage.getItem("dcspaceDashboardView");
      setRegisteredEvents(saved);
      setOrganizedEvents(readOrganizedEvents());
      setCanViewOrganizedEvents(canOrganizeEvents());

      if (requestedView === "organized" && canOrganizeEvents()) {
        setActiveDashboardView("organized");
        window.sessionStorage.removeItem("dcspaceDashboardView");
      }
    };

    refreshDashboardEvents();
    window.addEventListener('pageshow', refreshDashboardEvents);
    window.addEventListener('storage', refreshDashboardEvents);
    window.addEventListener('dcspace-events-updated', refreshDashboardEvents);
    window.addEventListener('dcspace-registered-events-updated', refreshDashboardEvents);

    return () => {
      window.removeEventListener('pageshow', refreshDashboardEvents);
      window.removeEventListener('storage', refreshDashboardEvents);
      window.removeEventListener('dcspace-events-updated', refreshDashboardEvents);
      window.removeEventListener('dcspace-registered-events-updated', refreshDashboardEvents);
    };
  }, []);

  useEffect(() => {
    if (!canViewOrganizedEvents && activeDashboardView === "organized") {
      setActiveDashboardView("registered");
    }
  }, [activeDashboardView, canViewOrganizedEvents]);

  useEffect(() => {
    setShowPrivacyModal(window.sessionStorage.getItem("dcspacePrivacySeen") !== "true");
  }, []);

  const handleAccept = () => {
    if (!consentChecked) {
      setShowValidation(true);
      return;
    }

    setShowPrivacyModal(false);
    setShowValidation(false);
    window.sessionStorage.setItem('dcspacePrivacySeen', 'true');
  };

  const handleCancel = () => {
    setConsentChecked(false);
    setShowValidation(false);
    setShowPrivacyModal(false);
    window.sessionStorage.setItem('dcspacePrivacySeen', 'true');
  };

  return (
    <section className="dashboard-page">
      <div className={showPrivacyModal ? 'dashboard-content dashboard-content--blurred' : 'dashboard-content'}>
        <section className="dashboard-views">
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab${isRegisteredView ? ' is-active' : ''}`}
              type="button"
              onClick={() => setActiveDashboardView('registered')}
            >
              Events Registered
            </button>
            {canViewOrganizedEvents && (
              <button
                className={`dashboard-tab${!isRegisteredView ? " is-active" : ""}`}
                type="button"
                onClick={() => setActiveDashboardView("organized")}
              >
                Events Organized
              </button>
            )}
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
                              onClick={() => event.id && setSelectedBrowseEventId(event.id)}
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
              <EmptyState message="No registered events found. Browse the Events tab and select an event to register." />
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
                  <span>{event.name}</span>
                  <span>{`${event.month} ${event.day}, ${event.year}`}</span>
                  <span>{getRegisteredEventSection(event) === 'today' ? 'Ongoing' : getRegisteredEventSection(event) === 'passed' ? 'Passed' : 'Upcoming'}</span>
                  <span>{event.certificate || 'Processing'}</span>

                  <Link className="details-button" href="/dashboard/organized-event" onClick={() => setSelectedBrowseEventId(event.id)}>
                    View Details
                    <Image src="/assets/chevron-double-right.svg" alt="" width={16} height={16} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </section>
          ) : (
            <EmptyState message="No organized events yet. If you would like to create or manage an event, click the plus button." />
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
