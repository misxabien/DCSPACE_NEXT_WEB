/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient, ObjectId } from 'mongodb';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB_NAME ?? 'dcspace';

const globalForMongo = globalThis as unknown as {
  adminFeedbackMongoClient?: MongoClient;
  adminFeedbackMongoPromise?: Promise<MongoClient>;
};

export type FeedbackStatus = 'new' | 'actioned' | 'reviewed';
export type FeedbackCategory = 'event' | 'system';

function createAppError(name: string, message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.name = name;
  error.status = status;
  return error;
}

async function getMongoClient() {
  if (globalForMongo.adminFeedbackMongoClient) {
    return globalForMongo.adminFeedbackMongoClient;
  }

  if (!globalForMongo.adminFeedbackMongoPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo.adminFeedbackMongoPromise = client.connect();
  }

  globalForMongo.adminFeedbackMongoClient = await globalForMongo.adminFeedbackMongoPromise;
  return globalForMongo.adminFeedbackMongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}

function toObjectId(id: string, label: string) {
  if (!ObjectId.isValid(id)) {
    throw createAppError('ValidationError', `Invalid ${label} id`, 400);
  }

  return new ObjectId(id);
}

function toNumericRating(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.min(5, Math.max(1, Math.round(numericValue)));
}

function roundAverage(value: number) {
  return Number(value.toFixed(1));
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return roundAverage(total / values.length);
}

function normalizeCategory(record: any): FeedbackCategory {
  const raw = (
    record.category ??
    record.feedbackCategory ??
    record.registrationType ??
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  if (raw === 'system' || raw.includes('system')) {
    return 'system';
  }

  const feedbackType = (record.feedbackType ?? '').toString().trim().toLowerCase();
  if (feedbackType === 'general' || feedbackType === 'issue') {
    return 'system';
  }

  return 'event';
}

function normalizeStatus(value: unknown): FeedbackStatus {
  const normalized = (value ?? 'new').toString().trim().toLowerCase();

  if (normalized === 'actioned' || normalized === 'resolved' || normalized === 'solved') {
    return 'actioned';
  }

  if (normalized === 'reviewed' || normalized === 'closed') {
    return 'reviewed';
  }

  return 'new';
}

function getUserDisplayName(user: any) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return user?.fullName ?? user?.name ?? fullName ?? user?.email ?? 'Unknown user';
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '??';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function formatSubmittedAt(value: Date | string | null | undefined) {
  if (!value) {
    return { iso: null, display: 'Unknown date' };
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { iso: null, display: 'Unknown date' };
  }

  return {
    iso: date.toISOString(),
    display: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  };
}

function getRecordRating(record: any) {
  const category = normalizeCategory(record);

  if (category === 'system') {
    return toNumericRating(record.systemRating ?? record.systemEaseOfUse ?? record.rating);
  }

  return toNumericRating(record.eventRating ?? record.rating);
}

function mapFeedbackListItem(record: any) {
  const category = normalizeCategory(record);
  const rating = getRecordRating(record);
  const userName = record.userName ?? getUserDisplayName(record.userSnapshot ?? record);

  return {
    id: String(record._id),
    rating,
    ratingOutOf: 5,
    category,
    user: {
      initials: record.userInitials ?? getInitials(userName),
      name: userName,
      email: record.userEmail ?? record.userSnapshot?.email ?? '',
    },
    eventName: record.eventName ?? (category === 'system' ? '—' : 'Unknown event'),
    facility: record.facility ?? record.eventVenue ?? record.venue ?? '—',
    status: normalizeStatus(record.status),
    submittedAt: formatSubmittedAt(record.createdAt).display,
  };
}

function mapFeedbackDetail(record: any) {
  const category = normalizeCategory(record);
  const rating = getRecordRating(record);
  const userSnapshot = record.userSnapshot ?? {};
  const userName = record.userName ?? getUserDisplayName(userSnapshot);
  const submittedAt = formatSubmittedAt(record.createdAt);

  return {
    id: String(record._id),
    rating,
    ratingOutOf: 5,
    category,
    feedbackType: record.feedbackType ?? (category === 'system' ? 'general' : 'event'),
    comment: record.comment ?? record.feedbackComment ?? '',
    status: normalizeStatus(record.status),
    user: {
      initials: record.userInitials ?? getInitials(userName),
      name: userName,
      email: record.userEmail ?? userSnapshot.email ?? '',
      studentNumber: userSnapshot.studentNumber ?? record.studentNumber ?? '—',
      course: userSnapshot.course ?? record.course ?? '—',
      yearSection: userSnapshot.yearSection ?? record.yearSection ?? '—',
      organization: userSnapshot.organizationPart ?? record.organizationPart ?? '—',
      role: userSnapshot.organizationRole ?? record.organizationRole ?? '—',
    },
    event: {
      categoryLabel: category === 'system' ? 'System feedback' : 'Event feedback',
      name: record.eventName ?? '—',
      location: record.facility ?? record.eventVenue ?? '—',
      date: record.eventDate ?? '—',
      eventId: record.eventId ? String(record.eventId) : null,
    },
    adminNotes: Array.isArray(record.adminNotes)
      ? record.adminNotes.map((note: any, index: number) => ({
          id: String(note._id ?? `${record._id}-${index}`),
          text: String(note.text ?? ''),
          createdAt: formatSubmittedAt(note.createdAt).display,
        }))
      : [],
    certificateId: record.certificateId ?? null,
    submittedAt: submittedAt.display,
    submittedAtIso: submittedAt.iso,
    updatedAt: formatSubmittedAt(record.updatedAt).display,
  };
}

/**
 * Returns the feedback overview stats and table rows for the admin feedback screen.
 */
export async function getFeedbackOverview() {
  const db = await getDatabase();
  const feedback = db.collection<any>('feedback');
  const records = await feedback.find({}).sort({ createdAt: -1, updatedAt: -1 }).limit(500).toArray();

  const eventRatings: number[] = [];
  const systemRatings: number[] = [];

  for (const record of records) {
    const category = normalizeCategory(record);
    const rating = getRecordRating(record);

    if (rating === null) {
      continue;
    }

    if (category === 'system') {
      systemRatings.push(rating);
    } else {
      eventRatings.push(rating);
    }
  }

  return {
    averageEventRating: getAverage(eventRatings),
    averageEventRatingOutOf: 5,
    averageEventRatingCount: eventRatings.length,
    systemEaseOfUse: getAverage(systemRatings),
    systemEaseOfUseOutOf: 5,
    systemEaseOfUseCount: systemRatings.length,
    feedbackList: records.map(mapFeedbackListItem),
  };
}

export async function getFeedbackById(id: string) {
  const feedback = (await getDatabase()).collection<any>('feedback');
  const record = await feedback.findOne({ _id: toObjectId(id, 'feedback') });

  if (!record) {
    throw createAppError('NotFoundError', 'Feedback not found', 404);
  }

  return mapFeedbackDetail(record);
}

export async function updateFeedbackRecord(
  id: string,
  input: {
    status?: FeedbackStatus;
    adminNote?: string;
    adminEmail?: string;
  },
) {
  const trimmedId = id?.trim();

  if (!trimmedId) {
    throw createAppError('ValidationError', 'Feedback id is required', 400);
  }

  const db = await getDatabase();
  const feedback = db.collection<any>('feedback');
  const objectId = toObjectId(trimmedId, 'feedback');
  const existing = await feedback.findOne({ _id: objectId });

  if (!existing) {
    throw createAppError('NotFoundError', 'Feedback not found', 404);
  }

  const now = new Date();
  const update: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.status) {
    update.status = normalizeStatus(input.status);
  }

  if (input.adminNote?.trim()) {
    const noteEntry = {
      text: input.adminNote.trim(),
      authorEmail: input.adminEmail?.trim().toLowerCase() || null,
      createdAt: now,
    };

    await feedback.updateOne(
      { _id: objectId },
      {
        $set: update,
        $push: { adminNotes: noteEntry } as any,
      },
    );
  } else {
    await feedback.updateOne({ _id: objectId }, { $set: update });
  }

  const refreshed = await feedback.findOne({ _id: objectId });
  return mapFeedbackDetail(refreshed);
}

export async function createFeedbackSubmission(input: {
  userId: string;
  userEmail: string;
  user: {
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
    course?: string;
    school?: string;
    organizationPart?: string;
    organizationRole?: string;
    yearSection?: string;
  };
  feedbackType: 'event' | 'general' | 'issue';
  eventId?: string;
  rating?: number;
  comment: string;
}) {
  const comment = input.comment?.trim();

  if (!comment) {
    throw createAppError('ValidationError', 'Comment is required', 400);
  }

  const feedbackType = input.feedbackType;
  const category: FeedbackCategory =
    feedbackType === 'general' || feedbackType === 'issue' ? 'system' : 'event';

  if (category === 'event' && !input.eventId?.trim()) {
    throw createAppError('ValidationError', 'Event is required for event feedback', 400);
  }

  if (category === 'event' && !input.rating) {
    throw createAppError('ValidationError', 'Rating is required for event feedback', 400);
  }

  const db = await getDatabase();
  const now = new Date();
  const userName = getUserDisplayName(input.user);

  let eventName = '—';
  let facility = '—';
  let eventDate = '—';
  let certificateId: string | null = null;

  if (input.eventId?.trim()) {
    const events = db.collection<any>('events');
    const event = await events.findOne({ _id: toObjectId(input.eventId.trim(), 'event') });

    if (!event) {
      throw createAppError('NotFoundError', 'Event not found', 404);
    }

    eventName = event.title ?? event.name ?? 'Untitled event';
    facility = event.venue ?? event.location ?? '—';
    eventDate =
      event.date instanceof Date
        ? new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }).format(event.date)
        : String(event.date ?? event.startDate ?? '—');

    const attendance = await db.collection('attendance_logs').findOne({
      userId: { $in: [input.userId, new ObjectId(input.userId)] },
      eventId: { $in: [input.eventId.trim(), new ObjectId(input.eventId.trim())] },
    });

    certificateId = attendance?.certificateId ? String(attendance.certificateId) : null;
  }

  const rating = toNumericRating(input.rating);
  const doc = {
    userId: input.userId,
    userEmail: input.userEmail.trim().toLowerCase(),
    userName,
    userInitials: getInitials(userName),
    studentNumber: input.user.studentNumber ?? '',
    feedbackType,
    category,
    eventId: input.eventId?.trim() || null,
    eventName,
    facility,
    eventVenue: facility,
    eventDate,
    eventRating: category === 'event' ? rating : null,
    systemRating: category === 'system' ? rating : null,
    rating: rating ?? null,
    comment,
    status: 'new' as FeedbackStatus,
    adminNotes: [],
    certificateId,
    userSnapshot: {
      firstName: input.user.firstName ?? '',
      lastName: input.user.lastName ?? '',
      email: input.userEmail.trim().toLowerCase(),
      studentNumber: input.user.studentNumber ?? '',
      course: input.user.course ?? '',
      school: input.user.school ?? '',
      organizationPart: input.user.organizationPart ?? '',
      organizationRole: input.user.organizationRole ?? '',
      yearSection: input.user.yearSection ?? '',
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('feedback').insertOne(doc);

  return {
    id: String(result.insertedId),
    message: 'Feedback submitted successfully.',
  };
}
