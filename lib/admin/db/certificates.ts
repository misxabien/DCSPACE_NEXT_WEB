import { MongoClient, ObjectId } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";

const globalForMongo = globalThis as unknown as {
  adminCertificatesMongoClient?: MongoClient;
  adminCertificatesMongoPromise?: Promise<MongoClient>;
};

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
  return db.collection<any>("events");
}

async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection<any>("users");
}

async function getAttendanceCollection() {
  const db = await getDatabase();
  return db.collection<any>("attendance");
}

function toObjectId(id: string, label: string) {
  if (!ObjectId.isValid(id)) {
    throw createAppError("ValidationError", `Invalid ${label} id`, 400);
  }

  return new ObjectId(id);
}

function formatDateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "TBA";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "TBA";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeUpdate(value: Date | string | null | undefined) {
  if (!value) {
    return "Just now";
  }

  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs) || diffMs < 60_000) {
    return "Just now";
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
    display: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
    relative: formatRelativeUpdate(date),
  };
}

function normalizeRegistrationStatus(user: any, attendance: any) {
  return (
    attendance.registrationStatus ??
    user.registrationStatus ??
    (user.rfid ? "Registered" : "Not Registered")
  );
}

function mapEventSummary(event: any) {
  const start = event.startTime ?? event.startDate ?? event.eventDate ?? null;
  const end = event.endTime ?? event.endDate ?? null;

  return {
    id: String(event._id),
    title: event.title ?? event.name ?? "Untitled event",
    date: formatDateLabel(start),
    venue: event.venue ?? event.location ?? "TBA",
    startTime: formatTimeLabel(start),
    endTime: formatTimeLabel(end),
    organizer: event.organizerName ?? event.organizer?.name ?? "Unknown organizer",
    course: event.course ?? "N/A",
    organization: event.organizationName ?? event.organization?.name ?? "N/A",
  };
}

function mapAttendeeRow(user: any, attendance: any) {
  const timestamp = formatTimestamp(
    attendance.updatedAt ?? user.updatedAt ?? attendance.createdAt ?? user.createdAt ?? null,
  );
  const userId = String(user._id);

  return {
    attendeeId: attendance?._id ? String(attendance._id) : userId,
    userId,
    name: user.name ?? user.fullName ?? "",
    email: user.email ?? "",
    id: String(user.studentId ?? user.idNumber ?? userId),
    organization: user.organizationName ?? user.organization?.name ?? "Unassigned",
    rfid: user.rfid ?? null,
    status: normalizeRegistrationStatus(user, attendance),
    attendanceStatus: attendance.attendanceStatus ?? "Pending",
    certificateStatus: attendance.certificateStatus ?? "Pending",
    toggleActive: attendance.isActive ?? true,
    lastUpdated: timestamp?.relative ?? "Just now",
    timestamp,
  };
}

async function findEventById(eventId: string) {
  const events = await getEventsCollection();
  const objectId = toObjectId(eventId, "event");
  const event = await events.findOne({ _id: objectId });

  if (!event) {
    throw createAppError("NotFoundError", "Event not found", 404);
  }

  return event;
}

/**
 * Returns the attendance and certificate table data for a single event.
 */
export async function getAttendeesByEvent(eventId: string, search?: string | null) {
  const trimmedEventId = eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError("ValidationError", "eventId is required", 400);
  }

  const [event, attendance, users] = await Promise.all([
    findEventById(trimmedEventId),
    getAttendanceCollection(),
    getUsersCollection(),
  ]);

  const eventObjectId = toObjectId(trimmedEventId, "event");
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

    rows.push(mapAttendeeRow(user, attendanceRow));
  }

  for (const user of userRows) {
    if (attendanceRows.some((attendanceRow) => String(attendanceRow.userId) === String(user._id))) {
      continue;
    }

    rows.push(
      mapAttendeeRow(user, {
        _id: String(user._id),
        isActive: true,
        attendanceStatus: "Pending",
        certificateStatus: "Pending",
        updatedAt: user.updatedAt ?? user.createdAt ?? null,
      }),
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
    throw createAppError("ValidationError", "eventId is required", 400);
  }

  await findEventById(trimmedEventId);

  const attendance = await getAttendanceCollection();
  const users = await getUsersCollection();
  const eventObjectId = toObjectId(trimmedEventId, "event");
  const userObjectId = toObjectId(id, "attendee");

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
    throw createAppError("NotFoundError", "Attendee not found", 404);
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
      attendanceStatus: "Pending",
      certificateStatus: "Pending",
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

  return {
    eventId: trimmedEventId,
    attendee: mapAttendeeRow(
      userRecord,
      refreshedAttendance ?? {
        _id: userRecord._id,
        isActive: resolvedIsActive,
        attendanceStatus: "Pending",
        certificateStatus: "Pending",
        updatedAt: now,
      },
    ),
  };
}
