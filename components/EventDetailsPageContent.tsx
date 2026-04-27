"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { fetchEventById, type UserEvent } from "@/lib/user-api";

const registeredEventsStorageKey = "dcspace_registered_events";

const eventDetails = {
  name: "Event Name",
  dateTime: "Event Date, Time Start and End",
  venue: "Event Venue",
  organizer: "Event Organizer",
  overview:
    "Last week, our school held a successful technology seminar that brought together students and professionals to learn about the latest trends in innovation. The event featured several guest speakers who shared their experiences in the field of information technology, providing valuable insights and practical advice. Participants were actively engaged through interactive discussions and hands-on activities, making the seminar both informative and enjoyable.",
  requirements: ["Parent's Consent Form"],
};

type EventDetailsSource = "events" | "dashboard";

type EventDetailsPageContentProps = {
  source?: EventDetailsSource;
  eventDate?: {
    month?: string;
    day?: string;
    year?: string;
  };
};

function getRegisteredEventStatusLabel(eventDate?: EventDetailsPageContentProps["eventDate"]) {
  if (!eventDate?.month || !eventDate.day || !eventDate.year) {
    return "Upcoming Event";
  }

  const parsedDate = new Date(`${eventDate.month} ${eventDate.day}, ${eventDate.year}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Upcoming Event";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  if (parsedDate.getTime() === today.getTime()) {
    return "Today's Event";
  }

  return parsedDate > today ? "Upcoming Event" : "Passed Event";
}

function toDateParts(input: string | undefined) {
  const parsed = new Date(String(input || ""));
  if (Number.isNaN(parsed.getTime())) {
    return {
      month: "",
      day: "",
      year: "",
    };
  }

  return {
    month: parsed.toLocaleString("en-US", { month: "long" }),
    day: String(parsed.getDate()),
    year: String(parsed.getFullYear()),
  };
}

export function EventDetailsPageContent({ source = "events", eventDate }: EventDetailsPageContentProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [fallbackFromQuery, setFallbackFromQuery] = useState({
    title: "",
    date: "",
    venue: "",
    organizer: "",
  });
  const isDashboardSource = source === "dashboard";
  const registeredEventStatus = getRegisteredEventStatusLabel(eventDate);
  const [showRequirements, setShowRequirements] = useState(false);
  const [fileAdded, setFileAdded] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [apiEvent, setApiEvent] = useState<UserEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const syncEventId = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("eventId") || "";
      setEventId(id);
      setFallbackFromQuery({
        title: params.get("title") || "",
        date: params.get("date") || "",
        venue: params.get("venue") || "",
        organizer: params.get("organizer") || "",
      });
    };
    syncEventId();
    window.addEventListener("popstate", syncEventId);
    return () => {
      window.removeEventListener("popstate", syncEventId);
    };
  }, []);

  useEffect(() => {
    if (!eventId) {
      setApiEvent(null);
      return;
    }
    fetchEventById(eventId).then((response) => setApiEvent(response.event)).catch(() => setApiEvent(null));
  }, [eventId]);

  const details = apiEvent
    ? {
        name: apiEvent.title,
        dateTime: `${apiEvent.date}${apiEvent.startTime && apiEvent.endTime ? ` | ${apiEvent.startTime} - ${apiEvent.endTime}` : ""}`,
        venue: apiEvent.venue,
        organizer: apiEvent.requester || "DC Space",
        overview: apiEvent.description || eventDetails.overview,
        requirements: eventDetails.requirements,
      }
    : {
        name: fallbackFromQuery.title || eventDetails.name,
        dateTime: fallbackFromQuery.date || eventDetails.dateTime,
        venue: fallbackFromQuery.venue || eventDetails.venue,
        organizer: fallbackFromQuery.organizer || eventDetails.organizer,
        overview: eventDetails.overview,
        requirements: eventDetails.requirements,
      };

  const handleConfirm = () => {
    if (!fileAdded) {
      return;
    }

    if (typeof window !== "undefined") {
      const existingRaw = window.localStorage.getItem(registeredEventsStorageKey);
      const existingEvents = (() => {
        try {
          const parsed = JSON.parse(existingRaw || "[]") as Array<Record<string, unknown>>;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      const resolvedDate = apiEvent?.date || fallbackFromQuery.date;
      const dateParts = toDateParts(resolvedDate);
      const eventIdForStorage = apiEvent?.id || eventId || `${details.name}-${details.dateTime}`.replace(/\s+/g, "-").toLowerCase();
      const newEvent = {
        id: eventIdForStorage,
        month: dateParts.month,
        day: dateParts.day,
        year: dateParts.year,
        name: details.name,
        dateTime: details.dateTime,
        venue: details.venue || "Event Venue",
        organizer: details.organizer || "Event Organizer",
      };

      const dedupedEvents = [
        newEvent,
        ...existingEvents.filter((event) => String(event.id || "") !== newEvent.id),
      ];
      window.localStorage.setItem(registeredEventsStorageKey, JSON.stringify(dedupedEvents));
    }

    setIsRedirecting(true);
    window.setTimeout(() => {
      startTransition(() => {
        router.push("/dashboard");
      });
    }, 180);
  };

  return (
    <section className={`event-details-page${isRedirecting ? " is-exiting" : ""}`}>
      {isDashboardSource ? (
        <section className="registered-details-tabs" aria-label="Dashboard sections">
          <Link className="registered-details-back" href="/dashboard">
            Events Registered
          </Link>
          <span>Events Organized</span>
        </section>
      ) : (
        <section className="details-header">
          <h1>Browse Events</h1>
          <label className="details-search">
            <svg className="details-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 18C11.775 17.9996 13.4988 17.4054 14.897 16.312L19.293 20.708L20.707 19.294L16.311 14.898C17.405 13.4997 17.9996 11.7754 18 10C18 5.589 14.411 2 10 2C5.589 2 2 5.589 2 10C2 14.411 5.589 18 10 18ZM10 4C13.309 4 16 6.691 16 10C16 13.309 13.309 16 10 16C6.691 16 4 13.309 4 10C4 6.691 6.691 4 10 4Z" fill="currentColor" />
            </svg>
            <input type="search" aria-label="Search events" />
          </label>
        </section>
      )}

      {isDashboardSource && <h2 className="registered-detail-status">{registeredEventStatus}</h2>}

      <section className="event-hero">
        <div className="event-hero-image">
          <svg viewBox="0 0 7 7" fill="none" aria-hidden="true">
            <path d="M1.38831 4.72105L2.63783 3.05502L3.60967 4.30454L4.30385 3.47153L5.2757 4.72105H1.38831ZM5.55337 1.66667H3.332L2.77666 1.11133H1.11064C0.963353 1.11133 0.8221 1.16984 0.717954 1.27398C0.613807 1.37813 0.555298 1.51938 0.555298 1.66667V4.99872C0.555298 5.146 0.613807 5.28726 0.717954 5.3914C0.8221 5.49555 0.963353 5.55406 1.11064 5.55406H5.55337C5.70066 5.55406 5.84191 5.49555 5.94605 5.3914C6.0502 5.28726 6.10871 5.146 6.10871 4.99872V2.22201C6.10871 2.07473 6.0502 1.93347 5.94605 1.82933C5.84191 1.72518 5.70066 1.66667 5.55337 1.66667Z" fill="currentColor" />
          </svg>
        </div>

        <div className="event-summary">
          <h2>{details.name}</h2>
          <p>
            <CalendarIcon />
            {details.dateTime}
          </p>
          <p>
            <VenueIcon />
            {details.venue}
          </p>
          <p>
            <OrganizerIcon />
            {details.organizer}
          </p>
        </div>
      </section>

      <section className="event-info">
        <h3>Overview</h3>
        <p>{details.overview}</p>

        <h3>Requirements</h3>
        <ul>
          {details.requirements.map((requirement) => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
      </section>

      {!isDashboardSource && (
        <div className="event-actions">
          <button className="go-back-button" type="button" onClick={() => router.back()}>
            Go Back
          </button>
          <button className="register-button" type="button" onClick={() => setShowRequirements(true)}>
            Register!
          </button>
        </div>
      )}

      {showRequirements && (
        <div className="requirements-overlay">
          <section className="requirements-modal" role="dialog" aria-modal="true" aria-label="Event requirements">
            <div className="requirements-header">
              <h2>Requirements:</h2>
              <button className="close-button" type="button" aria-label="Close requirements" onClick={() => setShowRequirements(false)}>
                <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <path d="M6.67969 24.5977H20.8945C23.3555 24.5977 24.5742 23.3789 24.5742 20.9648V6.65625C24.5742 4.24219 23.3555 3.02344 20.8945 3.02344H6.67969C4.23047 3.02344 3 4.23047 3 6.65625V20.9648C3 23.3906 4.23047 24.5977 6.67969 24.5977ZM6.70312 22.7109C5.53125 22.7109 4.88672 22.0898 4.88672 20.8711V6.75C4.88672 5.53125 5.53125 4.91016 6.70312 4.91016H20.8711C22.0312 4.91016 22.6875 5.53125 22.6875 6.75V20.8711C22.6875 22.0898 22.0312 22.7109 20.8711 22.7109H6.70312Z" fill="currentColor" />
                  <path d="M10.3125 19.1602C10.6875 19.1602 10.8984 19.0312 11.1914 18.6211L13.7227 15.0117H13.7695L16.3008 18.6211C16.5938 19.0312 16.8047 19.1602 17.1797 19.1602C17.707 19.1602 18.0938 18.8086 18.0938 18.3047C18.0938 18.0703 18.0234 17.8945 17.8711 17.6953L14.9297 13.6758L17.8945 9.64453C18.0586 9.43359 18.1289 9.24609 18.1289 9.02344C18.1289 8.56641 17.7305 8.20312 17.2383 8.20312C16.875 8.20312 16.6406 8.34375 16.3828 8.73047L13.9453 12.3398H13.875L11.3789 8.71875C11.1094 8.34375 10.8867 8.20312 10.4883 8.20312C9.98438 8.20312 9.57422 8.60156 9.57422 9.07031C9.57422 9.32812 9.64453 9.49219 9.82031 9.75L12.6328 13.6172L9.65625 17.7422C9.50391 17.9531 9.44531 18.1172 9.44531 18.3516C9.44531 18.8086 9.82031 19.1602 10.3125 19.1602Z" fill="currentColor" />
                </svg>
              </button>
            </div>

            <div className={`file-requirement${fileAdded ? " is-added" : ""}`}>
              <button className="file-row" type="button" onClick={() => setFileAdded(true)}>
                <span>Parent&apos;s Consent Form</span>
                <FileIcon />
              </button>
              <div className="file-added-strip" aria-hidden={!fileAdded}>
                File Added!
              </div>
            </div>

            <button className="confirm-button" type="button" onClick={handleConfirm}>
              Confirm
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 20V6C21 4.897 20.103 4 19 4H17V2H15V4H9V2H7V4H5C3.897 4 3 4.897 3 6V20C3 21.103 3.897 22 5 22H19C20.103 22 21 21.103 21 20ZM9 18H7V16H9V18ZM9 14H7V12H9V14ZM13 18H11V16H13V18ZM13 14H11V12H13V14ZM17 18H15V16H17ZM17 14H15V12H17ZM19 9H5V7H19V9Z" fill="currentColor" />
    </svg>
  );
}

function VenueIcon() {
  return (
    <svg viewBox="0 0 18 23" fill="none" aria-hidden="true">
      <path d="M9.26539 21.8715C10.4965 21.1209 11.6027 20.2113 12.5665 19.1968C14.6599 16.9975 16.0725 14.3097 16.6383 11.6724C17.2001 9.06878 16.9348 6.51759 15.692 4.54851C15.3389 3.98324 14.896 3.46664 14.3692 3.00245C12.8591 1.68287 11.1306 1.05396 9.39026 1.03712C7.56216 1.02402 5.70871 1.68287 4.06986 2.93507C3.3714 3.47039 2.79585 4.08619 2.34907 4.76563C1.19797 6.50261 0.848744 8.65886 1.22919 10.9143C1.61354 13.2035 2.74708 15.5974 4.55371 17.7668C5.81016 19.2791 7.39047 20.683 9.27125 21.8678L9.26539 21.8715ZM9.00006 3.96078C10.3755 3.96078 11.6242 4.4961 12.5236 5.36272C13.4269 6.22934 13.9849 7.42164 13.9849 8.74309C13.9849 10.0627 13.4269 11.2606 12.5236 12.1235C11.6203 12.9901 10.3775 13.5254 9.00006 13.5254C7.6246 13.5254 6.37595 12.9901 5.47654 12.1235C4.57322 11.2568 4.01523 10.0645 4.01523 8.74309C4.01523 7.42351 4.57322 6.22559 5.47654 5.36272C6.37985 4.4961 7.62264 3.96078 9.00006 3.96078Z" fill="currentColor" />
    </svg>
  );
}

function OrganizerIcon() {
  return (
    <svg viewBox="0 0 18 19" fill="none" aria-hidden="true">
      <path d="M4.5 4.5C4.5 6.981 6.519 9 9 9C11.481 9 13.5 6.981 13.5 4.5C13.5 2.019 11.481 0 9 0C6.519 0 4.5 2.019 4.5 4.5ZM17 19H18V18C18 14.141 14.859 11 11 11H7C3.14 11 0 14.141 0 18V19H17Z" fill="currentColor" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
