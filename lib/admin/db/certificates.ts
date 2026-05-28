/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient, ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB_NAME ?? 'dcspace';

const globalForMongo = globalThis as unknown as {
  adminCertificatesMongoClient?: MongoClient;
  adminCertificatesMongoPromise?: Promise<MongoClient>;
};
import { generateCertificatePdf } from '@/lib/admin/certificates/generate';
import type { CertificateData } from '@/lib/admin/certificates/generate';
import { createUserNotification } from '@/lib/admin/db/user-notifications';

function createAppError(name: string, message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.name = name;
  error.status = status;
  return error;
}

async function getMongoClient() {
  if (globalForMongo.adminCertificatesMongoClient) {
    return globalForMongo.adminCertificatesMongoClient;
  }

  if (!globalForMongo.adminCertificatesMongoPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo.adminCertificatesMongoPromise = client.connect();
  }

  globalForMongo.adminCertificatesMongoClient = await globalForMongo.adminCertificatesMongoPromise;
  return globalForMongo.adminCertificatesMongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}

async function getEventsCollection() {
  const db = await getDatabase();
  return db.collection<any>('events');
}

async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection<any>('users');
}

async function getAttendanceCollection() {
  const db = await getDatabase();
  return db.collection<any>('attendance_logs');
}

async function getCertificateTemplatesCollection() {
  const db = await getDatabase();
  return db.collection<any>('certificate_templates');
}

async function getEventRegistrationsCollection() {
  const db = await getDatabase();
  return db.collection<any>('event_registrations');
}

function toObjectId(id: string, label: string) {
  if (!ObjectId.isValid(id)) {
    throw createAppError('ValidationError', `Invalid ${label} id`, 400);
  }

  return new ObjectId(id);
}

function formatDateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return 'TBA';
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatTimeLabel(value: Date | string | null | undefined) {
  if (!value) {
    return 'TBA';
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeUpdate(value: Date | string | null | undefined) {
  if (!value) {
    return 'Just now';
  }

  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs) || diffMs < 60_000) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return {
    iso: date.toISOString(),
    display: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
    relative: formatRelativeUpdate(date),
  };
}

function normalizeRegistrationStatus(user: any, attendance: any) {
  return (
    attendance.registrationStatus ??
    user.registrationStatus ??
    (user.rfid ?? user.rfidNumber ? 'Registered' : 'Not Registered')
  );
}

function getUserDisplayName(user: any) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.name ?? user.fullName ?? fullName ?? user.email ?? '';
}

function mapEventSummary(event: any) {
  const start = event.startTime ?? event.startDate ?? event.eventDate ?? event.date ?? null;
  const end = event.endTime ?? event.endDate ?? null;
  const startLabel = formatTimeLabel(start);
  const endLabel = formatTimeLabel(end);
  const dateLine =
    event.date && startLabel !== 'TBA' && endLabel !== 'TBA'
      ? `${formatDateLabel(event.date)} · ${startLabel} – ${endLabel}`
      : startLabel !== 'TBA' && endLabel !== 'TBA'
        ? `${formatDateLabel(start)} · ${startLabel} – ${endLabel}`
        : formatDateLabel(start ?? event.date);

  return {
    id: String(event._id),
    title: event.title ?? event.name ?? 'Untitled event',
    date: dateLine,
    dateLabel: formatDateLabel(event.date ?? start),
    venue: event.venue ?? event.location ?? 'TBA',
    startTime: typeof event.startTime === 'string' ? event.startTime : startLabel,
    endTime: typeof event.endTime === 'string' ? event.endTime : endLabel,
    organizer:
      event.requester ??
      event.courseOrganizer ??
      event.organizerName ??
      event.organizer?.name ??
      'Unknown organizer',
    course: event.courseCode ?? event.course ?? 'N/A',
    organization:
      event.organizationName ?? event.organizationPart ?? event.organization?.name ?? 'N/A',
    minAttendance: event.minAttendance ?? event.minimumAttendanceTime ?? '',
    posterImage: event.posterImage ?? event.pubmatImage ?? null,
    submittedByEmail: event.submittedByEmail ?? null,
  };
}

/**
 * Lists approved events for the admin E-Certificate screen.
 */
export async function listEcertEvents(search?: string | null) {
  const events = await getEventsCollection();
  const normalizedSearch = search?.trim();

  const query: Record<string, unknown> = {
    status: { $in: ['approved', 'APPROVED'] },
  };

  if (normalizedSearch) {
    query.$or = [
      { title: { $regex: normalizedSearch, $options: 'i' } },
      { name: { $regex: normalizedSearch, $options: 'i' } },
      { venue: { $regex: normalizedSearch, $options: 'i' } },
      { requester: { $regex: normalizedSearch, $options: 'i' } },
    ];
  }

  const rows = await events.find(query).sort({ createdAt: -1 }).limit(50).toArray();

  return {
    events: rows.map(mapEventSummary),
  };
}

function mapAttendeeRow(user: any, attendance: any, event?: any) {
  const timestamp = formatTimestamp(
    attendance.updatedAt ?? user.updatedAt ?? attendance.createdAt ?? user.createdAt ?? null,
  );
  const userId = String(user._id);
  const attendanceStatus = deriveAttendanceStatus(attendance, event);

  return {
    attendeeId: attendance?._id ? String(attendance._id) : userId,
    userId,
    name: getUserDisplayName(user),
    email: user.email ?? '',
    id: String(user.studentNumber ?? user.studentId ?? user.idNumber ?? userId),
    organization: user.organizationName ?? user.organization?.name ?? 'Unassigned',
    rfid: user.rfid ?? user.rfidNumber ?? null,
    status: normalizeRegistrationStatus(user, attendance),
    attendanceStatus,
    certificateStatus: attendance.certificateStatus ?? (attendanceStatus === 'Completed' ? 'Available' : 'Pending'),
    toggleActive: attendance.isActive ?? true,
    lastUpdated: timestamp?.relative ?? 'Just now',
    tapIn: attendance.tapIn ?? attendance.attendance?.tapIn ?? '',
    tapOut: attendance.tapOut ?? attendance.attendance?.tapOut ?? '',
    canGenerate: attendanceStatus === 'Completed',
    canDownload: Boolean(attendance.certificateId),
    timestamp,
  };
}

async function findEventById(eventId: string) {
  const events = await getEventsCollection();
  const objectId = toObjectId(eventId, 'event');
  const event = await events.findOne({ _id: objectId });

  if (!event) {
    throw createAppError('NotFoundError', 'Event not found', 404);
  }

  return event;
}

/**
 * Returns the attendance and certificate table data for a single event.
 */
export async function getAttendeesByEvent(eventId: string, search?: string | null) {
  const trimmedEventId = eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  const [event, attendance, users, registrations] = await Promise.all([
    findEventById(trimmedEventId),
    getAttendanceCollection(),
    getUsersCollection(),
    getEventRegistrationsCollection(),
  ]);

  const eventObjectId = toObjectId(trimmedEventId, 'event');
  const registrationRows = await registrations.find({ eventId: trimmedEventId }).toArray();
  const attendanceRows = await attendance
    .find({
      $or: [{ eventId: trimmedEventId }, { eventId: eventObjectId }],
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const participantIds = new Set<string>();

  for (const row of attendanceRows) {
    if (row.userId) {
      participantIds.add(String(row.userId));
    }
  }

  for (const row of registrationRows) {
    if (row.userId) {
      participantIds.add(String(row.userId));
    }
  }

  if (Array.isArray(event.participantIds)) {
    for (const participantId of event.participantIds) {
      if (participantId) {
        participantIds.add(String(participantId));
      }
    }
  }

  const validParticipantObjectIds = Array.from(participantIds)
    .filter((participantId) => ObjectId.isValid(participantId))
    .map((participantId) => new ObjectId(participantId));

  const userQuery: Record<string, unknown> =
    validParticipantObjectIds.length > 0
      ? { _id: { $in: validParticipantObjectIds } }
      : { _id: { $in: [] } };

  const userRows = await users.find(userQuery).toArray();
  const usersById = new Map(userRows.map((user) => [String(user._id), user]));

  const rows: ReturnType<typeof mapAttendeeRow>[] = [];

  for (const attendanceRow of attendanceRows) {
    const user = usersById.get(String(attendanceRow.userId));

    if (!user) {
      continue;
    }

    rows.push(mapAttendeeRow(user, attendanceRow, event));
  }

  for (const user of userRows) {
    if (attendanceRows.some((attendanceRow) => String(attendanceRow.userId) === String(user._id))) {
      continue;
    }

    rows.push(
      mapAttendeeRow(
        user,
        {
          _id: String(user._id),
          isActive: true,
          registrationStatus: 'Registered',
          attendanceStatus: 'Pending',
          certificateStatus: 'Pending',
          updatedAt: user.updatedAt ?? user.createdAt ?? null,
        },
        event,
      ),
    );
  }

  const normalizedSearch = search?.trim().toLowerCase();
  const attendees = normalizedSearch
    ? rows.filter((row) => {
        return (
          row.name.toLowerCase().includes(normalizedSearch) ||
          row.email.toLowerCase().includes(normalizedSearch) ||
          row.id.toLowerCase().includes(normalizedSearch)
        );
      })
    : rows;

  return {
    event: mapEventSummary(event),
    attendees,
  };
}

/**
 * Toggles the active attendance status of an attendee record for a specific event.
 */
export async function toggleAttendeeStatus(id: string, eventId: string, nextStatus?: boolean) {
  const trimmedEventId = eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  await findEventById(trimmedEventId);

  const attendance = await getAttendanceCollection();
  const users = await getUsersCollection();
  const eventObjectId = toObjectId(trimmedEventId, 'event');
  const userObjectId = toObjectId(id, 'attendee');

  const existingAttendance = await attendance.findOne({
    $or: [
      { userId: id, eventId: trimmedEventId },
      { userId: userObjectId, eventId: trimmedEventId },
      { userId: id, eventId: eventObjectId },
      { userId: userObjectId, eventId: eventObjectId },
      { _id: userObjectId },
    ],
  });

  const userRecord =
    existingAttendance?.userId && ObjectId.isValid(String(existingAttendance.userId))
      ? await users.findOne({ _id: new ObjectId(String(existingAttendance.userId)) })
      : await users.findOne({ _id: userObjectId });

  if (!userRecord) {
    throw createAppError('NotFoundError', 'Attendee not found', 404);
  }

  const resolvedIsActive = nextStatus ?? !(existingAttendance?.isActive ?? true);
  const now = new Date();

  if (existingAttendance) {
    await attendance.updateOne(
      { _id: existingAttendance._id },
      {
        $set: {
          isActive: resolvedIsActive,
          updatedAt: now,
        },
      },
    );
  } else {
    await attendance.insertOne({
      eventId: eventObjectId,
      userId: userRecord._id,
      isActive: resolvedIsActive,
      attendanceStatus: 'Pending',
      certificateStatus: 'Pending',
      registrationStatus: normalizeRegistrationStatus(userRecord, {}),
      createdAt: now,
      updatedAt: now,
    });
  }

  const refreshedAttendance = await attendance.findOne({
    $or: [
      { userId: userRecord._id, eventId: trimmedEventId },
      { userId: userRecord._id, eventId: eventObjectId },
      { userId: String(userRecord._id), eventId: trimmedEventId },
      { userId: String(userRecord._id), eventId: eventObjectId },
    ],
  });

  const event = await findEventById(trimmedEventId);

  return {
    eventId: trimmedEventId,
    attendee: mapAttendeeRow(
      userRecord,
      refreshedAttendance ?? {
        _id: userRecord._id,
        isActive: resolvedIsActive,
        attendanceStatus: 'Pending',
        certificateStatus: 'Pending',
        updatedAt: now,
      },
      event,
    ),
  };
}

function formatCurrentTapTime(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
}

/**
 * Records a tap-in or tap-out for a student at an event (RFID kiosk / user app).
 */
export async function recordAttendanceTapForEvent(input: {
  eventId: string;
  rfidNumber: string;
  eventName?: string;
  eventDate?: string;
}) {
  const trimmedEventId = input.eventId?.trim();
  const rfid = input.rfidNumber?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  if (!rfid) {
    throw createAppError('ValidationError', 'rfidNumber is required', 400);
  }

  const event = await findEventById(trimmedEventId);
  const users = await getUsersCollection();
  const user = await users.findOne({
    $or: [{ rfidNumber: rfid }, { rfid: rfid }],
  });

  if (!user) {
    throw createAppError('NotFoundError', 'No user found for this RFID', 404);
  }

  const attendance = await getAttendanceCollection();
  const eventObjectId = toObjectId(trimmedEventId, 'event');
  const userId = user._id;
  const now = new Date();
  const currentTime = formatCurrentTapTime(now);

  const existing = await attendance.findOne({
    $or: [
      { userId: String(userId), eventId: trimmedEventId },
      { userId, eventId: trimmedEventId },
      { userId: String(userId), eventId: eventObjectId },
      { userId, eventId: eventObjectId },
    ],
  });

  let tapType: 'tap in' | 'tap out';

  if (!existing?.tapIn || existing.tapOut) {
    tapType = 'tap in';

    if (existing) {
      await attendance.updateOne(
        { _id: existing._id },
        {
          $set: {
            tapIn: currentTime,
            tapOut: null,
            attendanceStatus: 'Incomplete',
            certificateStatus: 'Pending',
            updatedAt: now,
          },
        },
      );
    } else {
      await attendance.insertOne({
        eventId: eventObjectId,
        userId,
        eventName: input.eventName ?? event.title ?? event.name,
        eventDate: input.eventDate ?? formatDateLabel(event.date ?? event.startDate),
        studentNumber: user.studentNumber ?? user.studentId,
        rfidNumber: rfid,
        tapIn: currentTime,
        tapOut: null,
        attendanceStatus: 'Incomplete',
        certificateStatus: 'Pending',
        registrationStatus: 'Registered',
        createdAt: now,
        updatedAt: now,
      });
    }
  } else {
    tapType = 'tap out';
    const nextStatus = deriveAttendanceStatus(
      { ...existing, tapOut: currentTime },
      event,
    );

    await attendance.updateOne(
      { _id: existing._id },
      {
        $set: {
          tapOut: currentTime,
          attendanceStatus: nextStatus,
          updatedAt: now,
        },
      },
    );

    if (nextStatus === 'Completed') {
      await tryAutoIssueCertificate(trimmedEventId, String(userId));
    }
  }

  const refreshed = await attendance.findOne({
    $or: [
      { userId: String(userId), eventId: trimmedEventId },
      { userId, eventId: trimmedEventId },
      { userId: String(userId), eventId: eventObjectId },
      { userId, eventId: eventObjectId },
    ],
  });

  return {
    message:
      tapType === 'tap in'
        ? `Tapped in at ${currentTime}`
        : `Tapped out at ${currentTime}`,
    tapType,
    currentTime,
    record: {
      eventId: trimmedEventId,
      eventName: input.eventName ?? event.title ?? event.name ?? 'Event',
      eventDate: input.eventDate ?? formatDateLabel(event.date ?? event.startDate),
      studentNumber: String(user.studentNumber ?? user.studentId ?? user._id),
      rfidNumber: rfid,
      tapIn: refreshed?.tapIn ?? (tapType === 'tap in' ? currentTime : ''),
      tapOut: refreshed?.tapOut ?? (tapType === 'tap out' ? currentTime : ''),
      updatedAt: (refreshed?.updatedAt ?? now).toISOString(),
    },
  };
}

/**
 * Issues a certificate automatically when attendance requirements are met.
 */
export async function tryAutoIssueCertificate(eventId: string, userId: string) {
  const trimmedEventId = eventId?.trim();
  const trimmedUserId = userId?.trim();

  if (!trimmedEventId || !trimmedUserId) {
    return { issued: false, reason: 'missing_ids' as const };
  }

  const event = await findEventById(trimmedEventId);
  const users = await getUsersCollection();
  const userObjectId = toObjectId(trimmedUserId, 'user');
  const user = await users.findOne({ _id: userObjectId });

  if (!user) {
    return { issued: false, reason: 'user_not_found' as const };
  }

  const attendance = await getAttendanceCollection();
  const eventObjectId = toObjectId(trimmedEventId, 'event');

  const attendanceRecord = await attendance.findOne({
    $or: [
      { userId: trimmedUserId, eventId: trimmedEventId },
      { userId: userObjectId, eventId: trimmedEventId },
      { userId: trimmedUserId, eventId: eventObjectId },
      { userId: userObjectId, eventId: eventObjectId },
    ],
  });

  if (!attendanceRecord) {
    return { issued: false, reason: 'no_attendance' as const };
  }

  if (attendanceRecord.certificateId) {
    return { issued: false, reason: 'already_issued' as const };
  }

  const status = deriveAttendanceStatus(attendanceRecord, event);

  if (status !== 'Completed') {
    return { issued: false, reason: status };
  }

  const templates = await getCertificateTemplatesCollection();
  const hasTemplate = Boolean(await templates.findOne({ eventId: trimmedEventId }));

  try {
    await fs.access(DEFAULT_TEMPLATE);
  } catch {
    if (!hasTemplate) {
      return { issued: false, reason: 'no_template' as const };
    }
  }

  const result = await generateAndSaveCertificate(trimmedEventId, trimmedUserId);

  const eventTitle = event.title ?? event.name ?? 'your event';

  if (user.email) {
    await createUserNotification({
      userEmail: user.email,
      eventId: trimmedEventId,
      eventTitle,
      type: 'certificate_ready',
      message: `Your e-certificate for "${eventTitle}" is ready to download.`,
    });
  }

  const registrations = await getEventRegistrationsCollection();
  await registrations.updateMany(
    {
      eventId: { $in: [trimmedEventId, eventObjectId] },
      userId: { $in: [trimmedUserId, userObjectId, String(userObjectId)] },
    },
    {
      $set: {
        certificateId: result.certificateId,
        certificateStatus: 'issued',
        updatedAt: new Date(),
      },
    },
  );

  return {
    issued: true,
    certificateId: result.certificateId,
  };
}

/* ------------------------------------------------------------------ */
/*  V2 — Cert-Attendance mapping for /api/admin/cert-attendance       */
/* ------------------------------------------------------------------ */

function formatTapTime(value: Date | string | null | undefined) {
  if (!value) return '00:00';

  if (typeof value === 'string' && /am|pm|^\d{1,2}:\d{2}/i.test(value.trim())) {
    return value.trim();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '00:00';

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseRequiredMinutes(minAttendance?: string) {
  if (!minAttendance) return 0;

  const value = minAttendance.toLowerCase();

  if (value.includes('none') || value.includes('tba')) return 0;

  const number = Number(value.match(/\d+(\.\d+)?/)?.[0] || 0);

  if (value.includes('hour')) return number * 60;
  if (value.includes('min')) return number;

  return number;
}

function getMinutesFromTimeLabel(time?: string) {
  if (!time) return null;

  const parsed = new Date(`January 1, 2026 ${time}`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.getHours() * 60 + parsed.getMinutes();
}

function getTotalAttendedMinutes(record: any) {
  const tapIn = record.tapIn ?? record.attendance?.tapIn ?? null;
  const tapOut = record.tapOut ?? record.attendance?.tapOut ?? null;
  const tapInMinutes = getMinutesFromTimeLabel(tapIn);
  const tapOutMinutes = getMinutesFromTimeLabel(tapOut);

  if (tapInMinutes === null || tapOutMinutes === null) {
    return 0;
  }

  return Math.max(0, tapOutMinutes - tapInMinutes);
}

function deriveAttendanceStatus(record: any, event?: any) {
  const tapIn = record.tapIn ?? record.attendance?.tapIn ?? null;
  const tapOut = record.tapOut ?? record.attendance?.tapOut ?? null;

  if (!tapIn && !tapOut) return 'Pending';

  const normalized = (
    record.attendanceStatus ??
    record.attendance?.status ??
    ''
  ).toString().trim().toLowerCase();

  if (['completed', 'complete', 'present', 'attended'].includes(normalized)) {
    return 'Completed';
  }

  if (tapIn && !tapOut) return 'Incomplete';

  if (tapIn && tapOut) {
    const requiredMinutes = parseRequiredMinutes(
      event?.minAttendance ?? event?.minimumAttendanceTime ?? event?.minAttendanceTime,
    );

    if (requiredMinutes > 0) {
      const attendedMinutes = getTotalAttendedMinutes(record);
      if (attendedMinutes < requiredMinutes) {
        return 'Undertime';
      }
    }

    return 'Completed';
  }

  return 'Pending';
}

function mapCertAttendanceRecord(user: any, attendance: any, event?: any) {
  const attendanceStatus = deriveAttendanceStatus(attendance, event);
  const userId = String(user._id);

  return {
    userId,
    studentNumber: String(user.studentNumber ?? user.studentId ?? user.idNumber ?? user._id),
    date: attendance.createdAt
      ? new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(
          attendance.createdAt instanceof Date
            ? attendance.createdAt
            : new Date(attendance.createdAt),
        )
      : 'N/A',
    registration: user.rfid ?? user.rfidNumber ? 'Registered' : 'Not Registered',
    tapIn: formatTapTime(attendance.tapIn ?? attendance.attendance?.tapIn),
    tapOut: formatTapTime(attendance.tapOut ?? attendance.attendance?.tapOut),
    attendance: attendanceStatus,
    certificateStatus: attendance.certificateId ? 'issued' : (attendanceStatus === 'Completed' ? 'available' : 'pending'),
    certificateId: attendance.certificateId ?? null,
    canGenerate: attendanceStatus === 'Completed',
    canDownload: !!attendance.certificateId,
  };
}

/**
 * Returns per-student attendance and certificate records in the v2 response
 * shape for the cert-attendance screen.
 */
export async function getCertAttendanceByEvent(
  eventId: string,
  search?: string | null,
) {
  const trimmedEventId = eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  const [event, attendance, users, registrations] = await Promise.all([
    findEventById(trimmedEventId),
    getAttendanceCollection(),
    getUsersCollection(),
    getEventRegistrationsCollection(),
  ]);

  const eventObjectId = toObjectId(trimmedEventId, 'event');
  const registrationRows = await registrations.find({ eventId: trimmedEventId }).toArray();
  const attendanceRows = await attendance
    .find({
      $or: [{ eventId: trimmedEventId }, { eventId: eventObjectId }],
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const participantIds = new Set<string>();

  for (const row of attendanceRows) {
    if (row.userId) participantIds.add(String(row.userId));
  }

  for (const row of registrationRows) {
    if (row.userId) participantIds.add(String(row.userId));
  }

  if (Array.isArray(event.participantIds)) {
    for (const pid of event.participantIds) {
      if (pid) participantIds.add(String(pid));
    }
  }

  const validIds = Array.from(participantIds)
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const userRows = await users
    .find(validIds.length > 0 ? { _id: { $in: validIds } } : { _id: { $in: [] } })
    .toArray();

  const usersById = new Map(userRows.map((u: any) => [String(u._id), u]));

  const records: ReturnType<typeof mapCertAttendanceRecord>[] = [];

  for (const row of attendanceRows) {
    const user = usersById.get(String(row.userId));
    if (!user) continue;

    if (
      search &&
      !String(user.studentId ?? user.idNumber ?? '')
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    ) {
      continue;
    }

    records.push(mapCertAttendanceRecord(user, row, event));
  }

  for (const user of userRows) {
    if (attendanceRows.some((row) => String(row.userId) === String(user._id))) {
      continue;
    }

    if (
      search &&
      !String(user.studentNumber ?? user.studentId ?? user.idNumber ?? '')
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    ) {
      continue;
    }

    records.push(
      mapCertAttendanceRecord(
        user,
        {
          createdAt: null,
          attendanceStatus: 'Pending',
        },
        event,
      ),
    );
  }

  const start = event.startTime ?? event.startDate ?? event.eventDate ?? null;
  const end = event.endTime ?? event.endDate ?? null;

  return {
    event: {
      id: String(event._id),
      name: event.title ?? event.name ?? 'Untitled event',
      date: formatDateLabel(start),
      venue: event.venue ?? event.location ?? 'TBA',
      startTime: formatTimeLabel(start),
      endTime: formatTimeLabel(end),
      organizer: event.organizerName ?? event.organizer?.name ?? 'Unknown organizer',
      course: event.course ?? 'N/A',
      organization: event.organizationName ?? event.organization?.name ?? 'N/A',
      sheetsUrl: event.sheetsUrl ?? event.googleSheetsUrl ?? null,
    },
    records,
  };
}

/* ------------------------------------------------------------------ */
/*  Certificate template resolution                                   */
/* ------------------------------------------------------------------ */

const CERTIFICATES_DIR = path.join(process.cwd(), 'public', 'certificates');
const DEFAULT_TEMPLATE = path.join(CERTIFICATES_DIR, 'default-template.png');

function templateDataToBuffer(value: any) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value?.buffer) {
    return Buffer.from(value.buffer);
  }

  return Buffer.from(value);
}

/**
 * Resolves the certificate template bytes for an event.
 * Checks for a MongoDB-backed upload first, then falls back to the default.
 */
export async function getEventTemplateBytes(eventId: string): Promise<Buffer> {
  const templates = await getCertificateTemplatesCollection();
  const template = await templates.findOne({ eventId });

  if (template?.data) {
    return templateDataToBuffer(template.data);
  }

  return fs.readFile(DEFAULT_TEMPLATE);
}

export async function saveCertificateTemplate(
  eventId: string,
  input: { fileName: string; contentType: string; data: Buffer },
) {
  const trimmedEventId = eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  await findEventById(trimmedEventId);

  const now = new Date();
  const templates = await getCertificateTemplatesCollection();
  const existingTemplate = await templates.findOne({ eventId: trimmedEventId });

  await templates.replaceOne(
    { eventId: trimmedEventId },
    {
      eventId: trimmedEventId,
      fileName: input.fileName,
      contentType: input.contentType,
      data: input.data,
      storage: 'mongodb',
      createdAt: existingTemplate?.createdAt ?? now,
      updatedAt: now,
    },
    { upsert: true },
  );

  const events = await getEventsCollection();
  await events.updateOne(
    { _id: toObjectId(trimmedEventId, 'event') },
    {
      $set: {
        eCertificateTemplate: input.fileName,
        eCertificateTemplateStorage: 'mongodb',
        updatedAt: now,
      },
    },
  );

  return {
    eventId: trimmedEventId,
    fileName: input.fileName,
    contentType: input.contentType,
    hasCustomTemplate: true,
    isDefault: false,
    storage: 'mongodb',
    updatedAt: now.toISOString(),
  };
}

export async function getCertificateTemplateInfo(eventId: string) {
  const trimmedEventId = eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  await findEventById(trimmedEventId);

  const templates = await getCertificateTemplatesCollection();
  const template = await templates.findOne({ eventId: trimmedEventId });

  if (template) {
    return {
      eventId: trimmedEventId,
      hasCustomTemplate: true,
      isDefault: false,
      fileName: template.fileName ?? null,
      contentType: template.contentType ?? null,
      storage: template.storage ?? 'mongodb',
      updatedAt: template.updatedAt?.toISOString?.() ?? null,
    };
  }

  await fs.access(DEFAULT_TEMPLATE);

  return {
    eventId: trimmedEventId,
    hasCustomTemplate: false,
    isDefault: true,
    fileName: path.basename(DEFAULT_TEMPLATE),
    contentType: 'image/png',
    storage: 'default-file',
    updatedAt: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Certificate generation + persistence                              */
/* ------------------------------------------------------------------ */

/**
 * Generates a PDF certificate for a student who has completed attendance
 * at the given event, persists the certificate metadata to the attendance
 * record, and returns the PDF bytes.
 */
export async function generateAndSaveCertificate(
  eventId: string,
  userId: string,
) {
  const trimmedEventId = eventId?.trim();
  const trimmedUserId = userId?.trim();

  if (!trimmedEventId) {
    throw createAppError('ValidationError', 'eventId is required', 400);
  }

  if (!trimmedUserId) {
    throw createAppError('ValidationError', 'userId is required', 400);
  }

  /* Fetch event, user, and attendance data. */
  const event = await findEventById(trimmedEventId);
  const users = await getUsersCollection();
  const userObjectId = toObjectId(trimmedUserId, 'user');
  const user = await users.findOne({ _id: userObjectId });

  if (!user) {
    throw createAppError('NotFoundError', 'User not found', 404);
  }

  const attendance = await getAttendanceCollection();
  const eventObjectId = toObjectId(trimmedEventId, 'event');

  const attendanceRecord = await attendance.findOne({
    $or: [
      { userId: trimmedUserId, eventId: trimmedEventId },
      { userId: userObjectId, eventId: trimmedEventId },
      { userId: trimmedUserId, eventId: eventObjectId },
      { userId: userObjectId, eventId: eventObjectId },
    ],
  });

  if (!attendanceRecord) {
    throw createAppError('NotFoundError', 'Attendance record not found', 404);
  }

  const status = deriveAttendanceStatus(attendanceRecord, event);

  if (status !== 'Completed') {
    throw createAppError(
      'ValidationError',
      'Cannot generate certificate — attendance is not completed',
      400,
    );
  }

  /* Resolve template. */
  const templateBytes = await getEventTemplateBytes(trimmedEventId);

  /* Build certificate data. */
  const now = new Date();
  const shortEventId = trimmedEventId.slice(-4).toUpperCase();
  const shortUserId = trimmedUserId.slice(-4).toUpperCase();
  const timestamp = now.getTime().toString(36).toUpperCase();
  const certificateId = `DC-${shortEventId}-${shortUserId}-${timestamp}`;

  const summary = mapEventSummary(event);

  const certData: CertificateData = {
    studentName: getUserDisplayName(user) || 'Student',
    eventTitle: event.title ?? event.name ?? 'Untitled Event',
    eventDate: summary.dateLabel,
    organizer: summary.organizer,
    organization: summary.organization,
    certificateId,
  };

  /* Generate the PDF. */
  const pdfBytes = await generateCertificatePdf(certData, templateBytes);

  /* Persist certificate metadata to the attendance record. */
  await attendance.updateOne(
    { _id: attendanceRecord._id },
    {
      $set: {
        certificateId,
        certificateStatus: 'issued',
        certificateGeneratedAt: now,
        updatedAt: now,
      },
    },
  );

  return {
    pdfBytes,
    certificateId,
    studentName: certData.studentName,
    eventTitle: certData.eventTitle,
  };
}
