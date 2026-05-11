import { REGISTERED_EVENTS_KEY, type RegisteredEvent } from "@/lib/attendance";

export const ORGANIZED_EVENTS_KEY = "dcspaceOrganizedEvents";
export const SELECTED_BROWSE_EVENT_KEY = "dcspaceSelectedBrowseEventId";

export type FrontendEvent = RegisteredEvent & {
  id: string;
  name: string;
  month: string;
  day: string;
  year: string;
  dateTime: string;
  venue: string;
  organizer: string;
  overview: string;
  requirements: string[];
  school?: string;
  department?: string;
  eventType?: string;
  duration?: string;
  minAttendance?: string;
  createdBy?: string;
};

export type OrganizedEventInput = {
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

const fallbackEvents: FrontendEvent[] = [
  {
    id: "sample-event-jan-24-2026",
    name: "Event Name",
    month: "JAN",
    day: "24",
    year: "2026",
    dateTime: "January 24, 2026, Event Date and Time",
    venue: "Event Venue",
    organizer: "Event Representative or Organizer",
    overview:
      "This event brings students together for a school activity. Details can be updated later when backend event management is connected.",
    requirements: ["Parent's Consent Form"],
    department: "Event Representative or Organizer",
  },
  {
    id: "sample-event-feb-08-2026",
    name: "Event Name",
    month: "FEB",
    day: "08",
    year: "2026",
    dateTime: "February 08, 2026, Event Date and Time",
    venue: "Event Venue",
    organizer: "Event Representative or Organizer",
    overview:
      "This event brings students together for a school activity. Details can be updated later when backend event management is connected.",
    requirements: ["Parent's Consent Form"],
    department: "Event Representative or Organizer",
  },
];

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function present(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "event";
}

function formatTime(value: string) {
  if (!value) return "TBA";

  const [hourValue, minuteValue] = value.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }

  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function datePartsFromInput(dateValue: string) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();

  if (Number.isNaN(date.getTime())) {
    return datePartsFromInput("");
  }

  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: date.toLocaleString("en-US", { day: "2-digit" }),
    year: String(date.getFullYear()),
    longDate: date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }),
  };
}

export function getCurrentOrganizationRole() {
  return present(window.localStorage.getItem("dcspaceOrganizationRole")) || "Organization Member";
}

export function canOrganizeEvents() {
  return getCurrentOrganizationRole().toLowerCase().includes("officer");
}

export function readOrganizedEvents() {
  return readJson<FrontendEvent[]>(window.localStorage, ORGANIZED_EVENTS_KEY, []);
}

export function writeOrganizedEvents(events: FrontendEvent[]) {
  window.localStorage.setItem(ORGANIZED_EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("dcspace-events-updated"));
}

export function readBrowseEvents() {
  const organized = readOrganizedEvents();
  const eventMap = new Map<string, FrontendEvent>();

  [...organized, ...fallbackEvents].forEach((event) => {
    eventMap.set(event.id, event);
  });

  return Array.from(eventMap.values());
}

export function saveOrganizedEvent(input: OrganizedEventInput) {
  const dateParts = datePartsFromInput(input.eventDate);
  const eventName = present(input.eventName) || "Event Name";
  const venue = present(input.venue) || "Event Venue";
  const organizer = present(input.courseOrganizer) || "Event Organizer";
  const startTime = formatTime(present(input.startTime));
  const endTime = formatTime(present(input.endTime));
  const id = normalizeKey(`${eventName}-${dateParts.year}-${dateParts.month}-${dateParts.day}-${organizer}`);
  const event: FrontendEvent = {
    id,
    name: eventName,
    month: dateParts.month,
    day: dateParts.day,
    year: dateParts.year,
    dateTime: `${dateParts.longDate}, ${startTime} - ${endTime}`,
    venue,
    organizer,
    overview:
      "This event was created from the frontend organize-event flow. The backend can later replace this local record with a saved database event.",
    requirements: ["Parent's Consent Form"],
    school: present(input.school) || "School",
    department: present(input.department) || "Department",
    eventType: present(input.eventType) || "Event",
    duration: present(input.duration) || "TBA",
    minAttendance: present(input.minAttendance) || "TBA",
    createdBy: present(window.localStorage.getItem("dcspaceStudentEmail")) || "local-frontend-user",
    status: "Created",
    certificate: "Processing",
  };
  const existing = readOrganizedEvents().filter((item) => item.id !== id);

  writeOrganizedEvents([event, ...existing]);
  setSelectedBrowseEventId(id);

  return event;
}

export function setSelectedBrowseEventId(eventId: string) {
  window.localStorage.setItem(SELECTED_BROWSE_EVENT_KEY, eventId);
}

export function readSelectedBrowseEvent() {
  const selectedId = window.localStorage.getItem(SELECTED_BROWSE_EVENT_KEY);
  const events = readBrowseEvents();

  return events.find((event) => event.id === selectedId) || events[0] || fallbackEvents[0];
}

export function registerEventForCurrentUser(event: FrontendEvent) {
  const registeredEvents = readJson<RegisteredEvent[]>(window.localStorage, REGISTERED_EVENTS_KEY, []);
  const alreadyRegistered = registeredEvents.some((registeredEvent) => registeredEvent.id === event.id);

  if (alreadyRegistered) {
    return registeredEvents;
  }

  const nextRegisteredEvents = [
    ...registeredEvents,
    {
      ...event,
      status: "Registered",
      certificate: "Pending",
    },
  ];

  window.localStorage.setItem(REGISTERED_EVENTS_KEY, JSON.stringify(nextRegisteredEvents));
  window.dispatchEvent(new CustomEvent("dcspace-registered-events-updated"));

  return nextRegisteredEvents;
}
