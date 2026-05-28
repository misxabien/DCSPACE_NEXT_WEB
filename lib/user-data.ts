import {
  addEventBookmark,
  deleteEvent,
  fetchAttendanceLogs,
  fetchBookmarkedEvents,
  fetchCertificates,
  fetchEventById,
  fetchEvents,
  fetchProfile,
  fetchRegistrations,
  readAuthSession,
  registerForEvent,
  removeEventBookmark,
  saveAuthSession,
  submitOrganizedEvent,
  updateProfile,
  type UserEvent,
  type UserProfile,
} from '@/lib/user-api';
import {
  mapRegistrationToRegistered,
  mapUserEventToFrontend,
  mapBackendAttendanceToRecord,
  canOrganizeFromProfile,
  syncProfileToLegacyStorage,
} from '@/lib/user-mappers';
import type { FrontendEvent } from '@/lib/dc-events';
import {
  ORGANIZED_EVENTS_KEY,
  readOrganizedEvents,
  setSelectedBrowseEventId,
  writeOrganizedEvents,
  SELECTED_BROWSE_EVENT_KEY,
} from '@/lib/dc-events';
import type { AttendanceRecord, RegisteredEvent, UploadedRequirementFile } from '@/lib/attendance';
import {
  getCurrentAttendanceUser,
  writeUserAttendanceRecords,
  REGISTERED_EVENTS_KEY,
} from '@/lib/attendance';
import { applyProfilePhotoLocally } from '@/lib/profile-images';

export const HOME_SAVED_EVENTS_KEY = 'dcspaceHomeSavedEvents';

function getSession() {
  return readAuthSession();
}

function getHomeSavedEventsStorageKey() {
  const session = getSession();
  const accountSeed = session?.user.id || session?.user.email || session?.user.studentNumber || 'guest';
  const normalizedAccount = accountSeed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'guest';
  return `${HOME_SAVED_EVENTS_KEY}:${normalizedAccount}`;
}

function cacheRegisteredEvents(events: RegisteredEvent[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REGISTERED_EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent('dcspace-registered-events-updated'));
}

export function hasBackendSession() {
  return Boolean(getSession()?.token);
}

export async function loadApprovedBrowseEvents(search?: string): Promise<FrontendEvent[]> {
  try {
    const { events } = await fetchEvents(search, { status: 'approved' });
    return events.map(mapUserEventToFrontend);
  } catch {
    return [];
  }
}

export async function loadOrganizedEventsForUser(): Promise<FrontendEvent[]> {
  const session = getSession();
  if (!session) {
    return [];
  }

  try {
    const { events } = await fetchEvents(undefined, {
      status: 'all',
      submittedByEmail: session.user.email,
    });
    const mapped = events.map(mapUserEventToFrontend);
    writeOrganizedEvents(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function loadBookmarkedEvents(): Promise<FrontendEvent[]> {
  const session = getSession();
  if (!session) {
    return [];
  }

  try {
    const { events } = await fetchBookmarkedEvents(session.token);
    return events.map(mapUserEventToFrontend);
  } catch {
    return [];
  }
}

function readCachedBookmarkIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(getHomeSavedEventsStorageKey()) || '[]') as string[];
  } catch {
    return [];
  }
}

export async function loadBookmarkedEventIds(): Promise<string[]> {
  const session = getSession();
  if (!session) {
    return readCachedBookmarkIds();
  }

  try {
    const events = await loadBookmarkedEvents();
    const ids = events.map((event) => event.id);
    window.localStorage.setItem(getHomeSavedEventsStorageKey(), JSON.stringify(ids));
    return ids;
  } catch {
    return readCachedBookmarkIds();
  }
}

export async function loadRegisteredEvents(): Promise<RegisteredEvent[]> {
  const session = getSession();
  if (!session) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(REGISTERED_EVENTS_KEY);
    }
    return [];
  }

  try {
    const { registrations } = await fetchRegistrations(session.token);
    const mapped = registrations.map(mapRegistrationToRegistered);
    cacheRegisteredEvents(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function registerEventForCurrentUser(
  event: FrontendEvent,
  requirementFiles: UploadedRequirementFile[] = [],
) {
  const session = getSession();

  if (!session) {
    throw new Error('Please sign in to register for events.');
  }

  await registerForEvent(session.token, {
    eventId: event.id,
    requirementFiles: requirementFiles.map((file) => ({
      requirementName: file.requirementName,
      name: file.name,
      type: file.type,
      size: file.size,
    })),
  });

  return loadRegisteredEvents();
}

export async function loadEventById(eventId: string): Promise<FrontendEvent | null> {
  try {
    const { event } = await fetchEventById(eventId);
    return mapUserEventToFrontend(event);
  } catch {
    return null;
  }
}

export async function loadAttendanceRecords(): Promise<Record<string, AttendanceRecord>> {
  const user = getCurrentAttendanceUser();
  const session = getSession();

  if (!session) {
    return {};
  }

  try {
    const { attendance } = await fetchAttendanceLogs(session.token);
    const records: Record<string, AttendanceRecord> = {};

    attendance.forEach((row) => {
      records[row.eventId] = mapBackendAttendanceToRecord(row);
    });

    writeUserAttendanceRecords(user, records);
    return records;
  } catch {
    return {};
  }
}

export async function loadCertificatesFromBackend() {
  const session = getSession();
  if (!session) {
    return [];
  }

  try {
    const { certificates } = await fetchCertificates(session.token);
    return certificates;
  } catch {
    return [];
  }
}

export async function submitOrganizedEventToBackend(payload: Parameters<typeof submitOrganizedEvent>[0]) {
  const session = getSession();
  if (!session) {
    throw new Error('Please sign in to create events.');
  }

  const email = session.user.email;
  const requester =
    payload.requester || `${session.user.firstName} ${session.user.lastName}`.trim();

  const result = await submitOrganizedEvent({
    ...payload,
    submittedByEmail: email,
    requester,
  });

  const frontend = mapUserEventToFrontend(result.event);
  const existing = readOrganizedEvents().filter((event) => event.id !== frontend.id);
  writeOrganizedEvents([frontend, ...existing]);
  setSelectedBrowseEventId(frontend.id);
  window.dispatchEvent(new CustomEvent('dcspace-events-updated'));

  return result;
}

export async function deleteOrganizedEventFromBackend(eventId: string) {
  const session = getSession();
  if (!session) {
    throw new Error('Please sign in to delete events.');
  }

  await deleteEvent(session.token, eventId);

  await loadOrganizedEventsForUser();
  await loadRegisteredEvents();

  if (typeof window !== 'undefined') {
    const bookmarkIds = readCachedBookmarkIds().filter((id) => id !== eventId);
    window.localStorage.setItem(getHomeSavedEventsStorageKey(), JSON.stringify(bookmarkIds));

    if (window.localStorage.getItem(SELECTED_BROWSE_EVENT_KEY) === eventId) {
      window.localStorage.removeItem(SELECTED_BROWSE_EVENT_KEY);
    }
  }

  window.dispatchEvent(new CustomEvent('dcspace-events-updated'));
  window.dispatchEvent(new CustomEvent('dcspace-registered-events-updated'));
}

export async function toggleEventBookmark(eventId: string, currentIds: string[]): Promise<string[]> {
  const isSaved = currentIds.includes(eventId);
  const session = getSession();

  if (!session) {
    throw new Error('Please sign in to save events.');
  }

  if (isSaved) {
    await removeEventBookmark(session.token, eventId);
    const next = currentIds.filter((id) => id !== eventId);
    window.localStorage.setItem(getHomeSavedEventsStorageKey(), JSON.stringify(next));
    return next;
  }

  await addEventBookmark(session.token, eventId);
  const next = [...currentIds, eventId];
  window.localStorage.setItem(getHomeSavedEventsStorageKey(), JSON.stringify(next));
  return next;
}

export async function refreshProfile() {
  const session = getSession();
  if (!session) {
    return null;
  }

  try {
    const { profile } = await fetchProfile(session.token);
    syncProfileToLegacyStorage(profile);
    saveAuthSession(session.token, profile);
    return profile;
  } catch {
    return null;
  }
}

export async function saveProfileToBackend(payload: Partial<UserProfile>) {
  const session = getSession();
  if (!session) {
    throw new Error('Please sign in to update your profile.');
  }

  const { profile } = await updateProfile(session.token, payload);
  syncProfileToLegacyStorage(profile);
  saveAuthSession(session.token, profile);
  return profile;
}

export async function saveProfilePhoto(photoUrl: string, fit?: { zoom: number; x: number; y: number }) {
  applyProfilePhotoLocally(photoUrl, fit);

  try {
    return await saveProfileToBackend({ photoUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save profile photo.';
    const isServerUnreachable = /could not reach the server|failed to update profile/i.test(message);

    if (isServerUnreachable) {
      return {
        profile: readAuthSession()?.user ?? null,
        syncedToDatabase: false,
        notice:
          'Photo updated on this device. Add MONGODB_URI and JWT_SECRET to .env.local (same as backend-user/.env), then restart npm run dev to save to the database.',
      };
    }

    throw error;
  }
}

export function userCanOrganize() {
  const session = getSession();
  if (session) {
    return canOrganizeFromProfile(session.user);
  }

  const role = typeof window !== 'undefined' ? window.localStorage.getItem('dcspaceOrganizationRole') : '';
  return role?.toLowerCase().includes('officer') ?? false;
}

export function mapEventsToRegistered(events: UserEvent[]) {
  return events.map((event) => mapUserEventToFrontend(event));
}

export function clearOrganizedEventsCache() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ORGANIZED_EVENTS_KEY);
}
