import type { UserEvent, UserProfile, UserRegistration } from '@/lib/user-api';
import type { FrontendEvent } from '@/lib/dc-events';
import type { AttendanceRecord, AttendanceUser, RegisteredEvent } from '@/lib/attendance';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const PROFILE_PHOTO_STORAGE_KEY = 'dcspaceProfilePhotoImage';

function normalizeStorageAccountKey(value?: string) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'guest';
}

function getProfilePhotoStorageKeyForProfile(profile: UserProfile) {
  const accountKey = normalizeStorageAccountKey(profile.id || profile.email || profile.studentNumber);
  return `${PROFILE_PHOTO_STORAGE_KEY}:${accountKey}`;
}

export function parseBackendEventDate(dateValue?: string) {
  if (!dateValue?.trim()) {
    return { month: '', day: '', year: '' };
  }

  const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = String(Number(isoMatch[3]));
    return {
      month: MONTHS[monthIndex] || '',
      day,
      year,
    };
  }

  const parsed = new Date(dateValue);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      month: MONTHS[parsed.getMonth()] || '',
      day: String(parsed.getDate()),
      year: String(parsed.getFullYear()),
    };
  }

  return { month: '', day: '', year: '' };
}

export function mapUserEventToFrontend(event: UserEvent): FrontendEvent {
  const { month, day, year } = parseBackendEventDate(event.date);
  const timeSuffix =
    event.startTime && event.endTime
      ? `, ${event.startTime} - ${event.endTime}`
      : event.startTime
        ? `, ${event.startTime}`
        : '';

  const dateLabel = event.date?.trim() || `${month} ${day}, ${year}`.trim();

  return {
    id: event.id,
    name: event.title || 'Event',
    month,
    day,
    year,
    dateTime: `${dateLabel}${timeSuffix}`.replace(/^,\s*/, ''),
    venue: event.venue || '',
    organizer: event.requester || '',
    organizerCourse: event.department || '',
    overview: event.description || '',
    requirements: [],
    school: '',
    department: event.department || '',
    status: event.status,
    certificate: event.certificate,
    createdBy: event.requester,
    bannerDataUrl: event.posterImage || undefined,
  };
}

export function mapUserEventToRegistered(event: UserEvent): RegisteredEvent {
  const frontend = mapUserEventToFrontend(event);
  return {
    id: frontend.id,
    name: frontend.name,
    month: frontend.month,
    day: frontend.day,
    year: frontend.year,
    dateTime: frontend.dateTime,
    venue: frontend.venue,
    organizer: frontend.organizer,
    status: frontend.status,
    certificate: frontend.certificate,
    bannerDataUrl: frontend.bannerDataUrl,
    requirements: frontend.requirements,
  };
}

export function mapRegistrationToRegistered(registration: UserRegistration): RegisteredEvent {
  const registered = mapUserEventToRegistered(registration.event);
  return {
    ...registered,
    id: registration.eventId || registered.id,
    status: registration.status || registered.status,
    certificate: registration.certificate || registered.certificate,
    requirementFiles: registration.requirementFiles?.map((file) => ({
      requirementName: file.requirementName,
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: '',
    })),
  };
}

export function canOrganizeFromProfile(profile: UserProfile | null) {
  const role = profile?.organizationRole?.toLowerCase() || '';
  return role.includes('officer');
}

export function mapBackendAttendanceToRecord(row: {
  eventId: string;
  eventName: string;
  eventDate: string;
  studentNumber: string;
  rfidNumber: string;
  tapIn?: string;
  tapOut?: string;
  taps?: Array<{ tapIn?: string; tapOut?: string }>;
  updatedAt?: string;
}): AttendanceRecord {
  const taps = row.taps?.length
    ? row.taps
    : row.tapIn || row.tapOut
      ? [{ tapIn: row.tapIn, tapOut: row.tapOut }]
      : [];

  return {
    eventId: row.eventId,
    eventName: row.eventName,
    eventDate: row.eventDate,
    studentNumber: row.studentNumber,
    rfidNumber: row.rfidNumber,
    taps,
    tapIn: row.tapIn,
    tapOut: row.tapOut,
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

export function syncProfileToLegacyStorage(profile: UserProfile) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('dcspaceFirstName', profile.firstName || '');
  window.localStorage.setItem('dcspaceLastName', profile.lastName || '');
  window.localStorage.setItem('dcspaceStudentNumber', profile.studentNumber || '');
  window.localStorage.setItem('dcspaceStudentEmail', profile.email || '');
  window.localStorage.setItem('dcspaceCourse', profile.course || '');
  window.localStorage.setItem('dcspaceSchool', profile.school || '');
  window.localStorage.setItem('dcspaceOrganizationPart', profile.organizationPart || '');
  window.localStorage.setItem('dcspaceOrganizationRole', profile.organizationRole || '');
  window.localStorage.setItem('dcspaceRfidNumber', profile.rfidNumber || '');
  if (profile.photoUrl && profile.photoUrl.length <= 300_000) {
    try {
      window.localStorage.setItem(getProfilePhotoStorageKeyForProfile(profile), profile.photoUrl);
      // Clean up old global key so photos stay isolated per account.
      window.localStorage.removeItem('dcspaceProfilePhotoImage');
    } catch {
      window.localStorage.removeItem(getProfilePhotoStorageKeyForProfile(profile));
    }
  }
  window.sessionStorage.setItem('dcspaceLoggedIn', 'true');

  const attendanceUser: AttendanceUser = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    studentNumber: profile.studentNumber,
    studentEmail: profile.email,
    rfidNumber: profile.rfidNumber || '',
    course: profile.course || '',
    school: profile.school || '',
    organizationPart: profile.organizationPart || '',
    organizationRole: profile.organizationRole || '',
    accountKey: profile.email || profile.studentNumber,
    isLoggedIn: true,
  };

  window.sessionStorage.setItem('dcspaceCurrentUser', JSON.stringify(attendanceUser));
  window.dispatchEvent(new CustomEvent('dcspace-profile-updated'));
}
