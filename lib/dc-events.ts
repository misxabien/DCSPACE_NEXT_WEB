import type { RegisteredEvent } from '@/lib/attendance';

export const ORGANIZED_EVENTS_KEY = 'dcspaceOrganizedEvents';
export const SELECTED_BROWSE_EVENT_KEY = 'dcspaceSelectedBrowseEventId';

export type FrontendEvent = RegisteredEvent & {
  id: string;
  name: string;
  month: string;
  day: string;
  year: string;
  dateTime: string;
  venue: string;
  organizer: string;
  organizerCourse?: string;
  overview: string;
  requirements: string[];
  school?: string;
  department?: string;
  eventType?: string;
  duration?: string;
  minAttendance?: string;
  attendanceAccess?: 'all' | 'specific';
  allowedCourses?: string[];
  registrationDeadline?: string;
  surveyFormLink?: string;
  announcements?: string;
  adminComments?: Array<{ message?: string; createdAt?: string }>;
  adminChangeRequest?: string;
  createdBy?: string;
  bannerDataUrl?: string;
};

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function readOrganizedEvents() {
  if (!isBrowser()) return [];
  return readJson<FrontendEvent[]>(window.localStorage, ORGANIZED_EVENTS_KEY, []);
}

export function writeOrganizedEvents(events: FrontendEvent[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ORGANIZED_EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent('dcspace-events-updated'));
}

export function setSelectedBrowseEventId(eventId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SELECTED_BROWSE_EVENT_KEY, eventId);
}
