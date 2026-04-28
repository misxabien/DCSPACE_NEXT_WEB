export const REGISTERED_EVENTS_KEY = "dcspaceRegisteredEvents";
export const LOGGED_IN_KEY = "dcspaceLoggedIn";
export const CURRENT_USER_KEY = "dcspaceCurrentUser";
export const SELECTED_ATTENDANCE_EVENT_KEY = "dcspaceSelectedAttendanceEventId";
export const ATTENDANCE_UPDATED_EVENT = "dcspace-attendance-updated";

const ATTENDANCE_RECORDS_KEY_PREFIX = "dcspaceAttendanceRecords:";
const DEFAULT_STUDENT_NUMBER = "2025-0000";

export type EventStatus = "Ongoing" | "Passed" | "Upcoming";
export type RequirementStatus = "Completed" | "Processing";
export type CertificateStatus = "Download" | "Processing";

export type RegisteredEvent = {
  id?: string;
  month?: string;
  day?: string;
  year?: string;
  name?: string;
  dateTime?: string;
  venue?: string;
  organizer?: string;
  status?: string;
  certificate?: string;
};

export type AttendanceUser = {
  studentNumber: string;
  studentEmail: string;
  rfidNumber: string;
  accountKey: string;
  isLoggedIn: boolean;
};

export type AttendanceRecord = {
  eventId: string;
  eventName: string;
  eventDate: string;
  studentNumber: string;
  rfidNumber: string;
  tapIn?: string;
  tapOut?: string;
  updatedAt: string;
};

export type AttendanceTapResult = {
  ok: boolean;
  message: string;
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

function present(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guest";
}

function normalizeRfid(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function readRegisteredEvents() {
  return readJson<RegisteredEvent[]>(window.localStorage, REGISTERED_EVENTS_KEY, []);
}

export function signInAttendanceUser(email?: string) {
  const savedEmail = present(email) || present(window.localStorage.getItem("dcspaceStudentEmail"));
  const studentNumber = present(window.localStorage.getItem("dcspaceStudentNumber")) || DEFAULT_STUDENT_NUMBER;
  const rfidNumber = present(window.localStorage.getItem("dcspaceRfidNumber"));

  const user: AttendanceUser = {
    studentNumber,
    studentEmail: savedEmail,
    rfidNumber,
    accountKey: normalizeKey(savedEmail || studentNumber || rfidNumber),
    isLoggedIn: true,
  };

  window.sessionStorage.setItem(LOGGED_IN_KEY, "true");
  window.sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  if (savedEmail) {
    window.localStorage.setItem("dcspaceStudentEmail", savedEmail);
  }

  return user;
}

export function signOutAttendanceUser() {
  window.sessionStorage.removeItem(LOGGED_IN_KEY);
  window.sessionStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentAttendanceUser(): AttendanceUser {
  const sessionUser = readJson<Partial<AttendanceUser>>(window.sessionStorage, CURRENT_USER_KEY, {});
  const studentEmail =
    present(sessionUser.studentEmail) || present(window.localStorage.getItem("dcspaceStudentEmail"));
  const studentNumber =
    present(sessionUser.studentNumber) ||
    present(window.localStorage.getItem("dcspaceStudentNumber")) ||
    DEFAULT_STUDENT_NUMBER;
  const rfidNumber =
    present(sessionUser.rfidNumber) || present(window.localStorage.getItem("dcspaceRfidNumber"));
  const isLoggedIn =
    window.sessionStorage.getItem(LOGGED_IN_KEY) === "true" ||
    Boolean(window.sessionStorage.getItem(CURRENT_USER_KEY));

  return {
    studentNumber,
    studentEmail,
    rfidNumber,
    accountKey: normalizeKey(studentEmail || studentNumber || rfidNumber),
    isLoggedIn,
  };
}

export function getRegisteredEventId(event: RegisteredEvent) {
  const raw =
    event.id ||
    [event.name, event.month, event.day, event.year, event.dateTime].filter(Boolean).join("|") ||
    "event";

  return normalizeKey(raw);
}

export function getRegisteredEventDate(event: RegisteredEvent) {
  if (!event.month || !event.day || !event.year) {
    return null;
  }

  const parsedDate = new Date(`${event.month} ${event.day}, ${event.year}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

export function formatEventDate(event: RegisteredEvent) {
  const eventDate = getRegisteredEventDate(event);

  if (!eventDate) {
    return "MM/DD/YYYY";
  }

  return eventDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export function getEventStatus(event: RegisteredEvent, now = new Date()): EventStatus {
  const eventDate = getRegisteredEventDate(event);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (!eventDate) {
    return "Upcoming";
  }

  if (eventDate.getTime() === today.getTime()) {
    return "Ongoing";
  }

  return eventDate < today ? "Passed" : "Upcoming";
}

export function getAttendanceStorageKey(user: AttendanceUser) {
  return `${ATTENDANCE_RECORDS_KEY_PREFIX}${user.accountKey}`;
}

export function readUserAttendanceRecords(user: AttendanceUser) {
  return readJson<Record<string, AttendanceRecord>>(window.localStorage, getAttendanceStorageKey(user), {});
}

export function writeUserAttendanceRecords(user: AttendanceUser, records: Record<string, AttendanceRecord>) {
  window.localStorage.setItem(getAttendanceStorageKey(user), JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(ATTENDANCE_UPDATED_EVENT));
}

export function isAttendanceComplete(record?: AttendanceRecord) {
  return Boolean(record?.tapIn && record.tapOut);
}

export function getRequirementStatus(record?: AttendanceRecord): RequirementStatus {
  return isAttendanceComplete(record) ? "Completed" : "Processing";
}

export function getCertificateStatus(record?: AttendanceRecord): CertificateStatus {
  return isAttendanceComplete(record) ? "Download" : "Processing";
}

export function setSelectedAttendanceEvent(eventId: string) {
  window.localStorage.setItem(SELECTED_ATTENDANCE_EVENT_KEY, eventId);
}

export function getSelectedAttendanceEventId() {
  return window.localStorage.getItem(SELECTED_ATTENDANCE_EVENT_KEY) || "";
}

export function recordRfidAttendanceTap(scannedRfid: string, events: RegisteredEvent[]) {
  const user = getCurrentAttendanceUser();
  const normalizedScan = normalizeRfid(scannedRfid);

  if (!user.isLoggedIn) {
    return { ok: false, message: "Please sign in before tapping an RFID card." };
  }

  if (!user.rfidNumber || normalizeRfid(user.rfidNumber) !== normalizedScan) {
    return { ok: false, message: "RFID card does not match the signed-in account." };
  }

  const ongoingEvent = events.find((event) => getEventStatus(event) === "Ongoing");

  if (!ongoingEvent) {
    return { ok: false, message: "No registered event is ongoing today." };
  }

  const eventId = getRegisteredEventId(ongoingEvent);
  const records = readUserAttendanceRecords(user);
  const now = new Date();
  const existingRecord = records[eventId];
  const nextRecord: AttendanceRecord = {
    eventId,
    eventName: ongoingEvent.name || "Event Name",
    eventDate: formatEventDate(ongoingEvent),
    studentNumber: user.studentNumber,
    rfidNumber: user.rfidNumber,
    tapIn: existingRecord?.tapIn,
    tapOut: existingRecord?.tapOut,
    updatedAt: now.toISOString(),
  };

  if (!nextRecord.tapIn) {
    nextRecord.tapIn = formatAttendanceTime(now);
    records[eventId] = nextRecord;
    writeUserAttendanceRecords(user, records);
    setSelectedAttendanceEvent(eventId);
    return { ok: true, message: `${nextRecord.eventName} tap in recorded.` };
  }

  if (!nextRecord.tapOut) {
    nextRecord.tapOut = formatAttendanceTime(now);
    records[eventId] = nextRecord;
    writeUserAttendanceRecords(user, records);
    setSelectedAttendanceEvent(eventId);
    return { ok: true, message: `${nextRecord.eventName} tap out recorded.` };
  }

  return { ok: false, message: `${nextRecord.eventName} attendance is already completed.` };
}

export function downloadAttendanceCertificate(
  event: RegisteredEvent,
  user: AttendanceUser,
  record?: AttendanceRecord,
) {
  if (!isAttendanceComplete(record)) {
    return;
  }

  const eventName = event.name || record?.eventName || "Event Name";
  const issuedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
  const certificate = [
    "DC Space E-Certificate",
    "",
    `This certifies that student ${user.studentNumber} completed the attendance requirement for:`,
    eventName,
    "",
    `Event Date: ${formatEventDate(event)}`,
    `Tap IN: ${record?.tapIn || ""}`,
    `Tap OUT: ${record?.tapOut || ""}`,
    `Issued Date: ${issuedDate}`,
  ].join("\n");
  const blob = new Blob([certificate], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `DCSPACE-Certificate-${normalizeKey(eventName)}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 100);
}

function formatAttendanceTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
