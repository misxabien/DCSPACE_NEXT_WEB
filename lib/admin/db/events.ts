/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import { createUserNotification } from '@/lib/admin/db/user-notifications';
import { getUserDb } from '@/lib/user-server/get-user-db';

function createAppError(name: string, message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.name = name;
  error.status = status;
  return error;
}

async function getDatabase() {
  return getUserDb();
}

async function getEventsCollection() {
  const db = await getDatabase();
  return db.collection<any>('events');
}

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw createAppError('ValidationError', 'Invalid event id', 400);
  }

  return new ObjectId(id);
}

function normalizeTextFilter(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned ? cleaned : undefined;
}

function normalizeStatus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === 'all') {
    return 'all';
  }

  if (normalized === 'pending') {
    return 'pending';
  }

  if (normalized === 'approved') {
    return 'approved';
  }

  return 'all';
}

function toDateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return 'TBA';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' && value.trim() ? value.trim() : 'TBA';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function toTimeLabel(startValue: Date | string | null | undefined, endValue: Date | string | null | undefined) {
  if (!startValue) {
    return 'TBA';
  }

  if (typeof startValue === 'string') {
    const rawStart = startValue.trim();
    const rawEnd = typeof endValue === 'string' ? endValue.trim() : '';

    if (rawStart && /^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(rawStart)) {
      if (rawEnd && /^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(rawEnd)) {
        return `${rawStart.toUpperCase()} - ${rawEnd.toUpperCase()}`;
      }

      return rawStart.toUpperCase();
    }
  }

  const start = startValue instanceof Date ? startValue : new Date(startValue);
  if (Number.isNaN(start.getTime())) {
    return typeof startValue === 'string' && startValue.trim() ? startValue.trim() : 'TBA';
  }

  const end = endValue ? (endValue instanceof Date ? endValue : new Date(endValue)) : null;
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!end || Number.isNaN(end.getTime())) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function normalizeEventStatus(status: unknown) {
  return (status ?? 'pending').toString().toLowerCase();
}

function getAllowedActions(status: string) {
  return status === 'approved'
    ? ['comment']
    : ['approve', 'reject', 'requestChanges', 'comment'];
}

function mapEventCard(event: any) {
  const start = event.startTime ?? event.startDate ?? event.eventDate ?? event.date ?? null;
  const end = event.endTime ?? event.endDate ?? null;
  const timeDisplay =
    typeof event.startTime === 'string' &&
    event.startTime.trim() &&
    typeof event.endTime === 'string' &&
    event.endTime.trim()
      ? `${event.startTime.trim()} - ${event.endTime.trim()}`
      : toTimeLabel(start, end);

  return {
    id: String(event._id),
    title: event.title ?? event.name ?? 'Untitled event',
    date: event.date ? toDateLabel(event.date) : toDateLabel(start),
    time: timeDisplay,
    venue: event.venue ?? event.location ?? 'TBA',
    organizer:
      event.requester ??
      event.courseOrganizer ??
      event.representativeName ??
      event.organizerName ??
      event.organizer?.name ??
      event.createdByName ??
      'Unknown organizer',
    pubmatImage:
      event.pubmatImage ??
      event.posterUrl ??
      event.eventPoster ??
      event.attachments?.eventPoster ??
      null,
    status: normalizeEventStatus(event.status),
  };
}

function safeMapEventCard(event: any) {
  try {
    return mapEventCard(event);
  } catch (error) {
    return {
      id: String(event?._id ?? ''),
      title: event?.title ?? event?.name ?? 'Untitled event',
      date: 'TBA',
      time: 'TBA',
      venue: event?.venue ?? event?.location ?? 'TBA',
      organizer:
        event?.requester ??
        event?.courseOrganizer ??
        event?.representativeName ??
        event?.organizerName ??
        event?.createdByName ??
        'Unknown organizer',
      pubmatImage:
        event?.pubmatImage ??
        event?.posterUrl ??
        event?.eventPoster ??
        event?.attachments?.eventPoster ??
        null,
      status: normalizeEventStatus(event?.status),
      _mappingError: error instanceof Error ? error.message : 'Unknown mapping error',
    };
  }
}

function mapEventDetail(event: any) {
  const start = event.startTime ?? event.startDate ?? event.eventDate ?? event.date ?? null;
  const end = event.endTime ?? event.endDate ?? null;
  const status = normalizeEventStatus(event.status);
  const allowedActions = getAllowedActions(status);
  const latestComment = Array.isArray(event.adminComments)
    ? event.adminComments[event.adminComments.length - 1]
    : null;

  return {
    id: String(event._id),
    title: event.title ?? event.name ?? 'Untitled event',
    description: event.description ?? '',
    date: event.date ? toDateLabel(event.date) : toDateLabel(start),
    venue: event.venue ?? event.location ?? 'TBA',
    startTime:
      typeof event.startTime === 'string' && event.startTime.trim()
        ? event.startTime.trim()
        : toTimeLabel(start, null),
    endTime:
      typeof event.endTime === 'string' && event.endTime.trim()
        ? event.endTime.trim()
        : toTimeLabel(end, null),
    organizer:
      event.requester ??
      event.courseOrganizer ??
      event.organizerName ??
      event.organizer?.name ??
      'Unknown organizer',
    campus: event.school ?? event.campus ?? 'N/A',
    department: event.department ?? 'N/A',
    course: event.courseCode ?? event.course ?? 'N/A',
    organization:
      event.organizationName ??
      event.organizationPart ??
      event.courseOrganizer ??
      event.organization?.name ??
      'N/A',
    type: event.type ?? event.eventType ?? 'N/A',
    duration: event.totalDuration ?? event.duration ?? 'N/A',
    minimumAttendanceTime:
      event.minimumAttendanceTime ?? event.minAttendance ?? event.minAttendanceTime ?? 'N/A',
    submittedByEmail: event.submittedByEmail ?? null,
    latestAdminComment: latestComment?.message ?? '',
    surveyLink: event.surveyLink ?? null,
    submittedAt: event.submittedAt ?? event.createdAt ?? null,
    status,
    canModerate: status !== 'approved',
    allowedActions,
    attachments: {
      eventPoster:
        event.posterImage ?? event.eventPoster ?? event.attachments?.eventPoster ?? null,
      roomReservationForm:
        event.roomReservationForm ?? event.attachments?.roomReservationForm ?? null,
      approvedConceptPaper:
        event.approvedConceptPaper ?? event.attachments?.approvedConceptPaper ?? null,
      eCertificateTemplate:
        event.eCertificateTemplate ?? event.attachments?.eCertificateTemplate ?? null,
    },
    adminComments: Array.isArray(event.adminComments) ? event.adminComments : [],
  };
}

export type GetEventsParams = {
  status?: string | null;
  search?: string | null;
  filter?: string | null;
  page?: number | null;
  limit?: number | null;
};

/**
 * Returns the paginated event cards for the admin event management list screen.
 */
export async function getEvents(params: GetEventsParams) {
  const events = await getEventsCollection();
  const status = normalizeStatus(params.status);
  const search = normalizeTextFilter(params.search);
  const filter = normalizeTextFilter(params.filter);
  const page = Math.max(Number(params.page ?? 1) || 1, 1);
  const limit = Math.max(Number(params.limit ?? 10) || 10, 1);
  const skip = (page - 1) * limit;

  const andConditions: Record<string, unknown>[] = [];

  if (status === 'pending') {
    andConditions.push({
      $or: [
        {
          status: {
            $regex: '^(pending|pending_approval|changes_requested|draft)$',
            $options: 'i',
          },
        },
        { status: { $exists: false } },
        { status: null },
        { status: '' },
      ],
    });
  }

  if (status === 'approved') {
    andConditions.push({
      status: {
        $regex: '^approved$',
        $options: 'i',
      },
    });
  }

  if (search) {
    andConditions.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { requester: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { submittedByEmail: { $regex: search, $options: 'i' } },
      ],
    });
  }

  if (filter) {
    andConditions.push({
      $or: [
        { type: { $regex: filter, $options: 'i' } },
        { campus: { $regex: filter, $options: 'i' } },
        { department: { $regex: filter, $options: 'i' } },
        { organizationName: { $regex: filter, $options: 'i' } },
      ],
    });
  }

  const query = andConditions.length > 0 ? { $and: andConditions } : {};
  const total = await events.countDocuments(query);
  const rows = await events
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    events: rows.map(safeMapEventCard),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: totalPages > 0 && page < totalPages,
      showingFrom: total === 0 ? 0 : skip + 1,
      showingTo: total === 0 ? 0 : Math.min(skip + rows.length, total),
    },
  };
}

/**
 * Returns the full event detail for the pending and approved event detail screens.
 */
export async function getEventById(id: string) {
  const events = await getEventsCollection();
  const event = await events.findOne({ _id: toObjectId(id) });

  if (!event) {
    throw createAppError('NotFoundError', 'Event not found', 404);
  }

  return mapEventDetail(event);
}

/**
 * Updates the moderation status of an event and optionally appends an admin comment.
 */
export async function updateEventStatus(id: string, status: string, comment?: string) {
  const events = await getEventsCollection();
  const objectId = toObjectId(id);
  const existingEvent = await events.findOne({ _id: objectId });

  if (!existingEvent) {
    throw createAppError('NotFoundError', 'Event not found', 404);
  }

  const currentStatus = normalizeEventStatus(existingEvent.status);
  const normalizedStatus = status.trim().toLowerCase();
  const allowedStatuses = ['approved', 'rejected', 'changes_requested'];

  if (!allowedStatuses.includes(normalizedStatus)) {
    throw createAppError('ValidationError', 'Invalid event status', 400);
  }

  if (currentStatus === 'approved') {
    throw createAppError('ValidationError', 'Moderation actions are disabled for approved events', 400);
  }

  const updateOperation: Record<string, unknown> = {
    $set: {
      status: normalizedStatus,
      updatedAt: new Date(),
    },
  };

  if (comment?.trim()) {
    updateOperation.$push = {
      adminComments: {
        message: comment.trim(),
        createdAt: new Date(),
      },
    };
  }

  if (normalizedStatus === 'changes_requested' && comment?.trim()) {
    (updateOperation.$set as Record<string, unknown>).adminChangeRequest = comment.trim();
  }

  await events.updateOne({ _id: objectId }, updateOperation as any);
  const updatedEvent = await events.findOne({ _id: objectId });

  const organizerEmail = String(updatedEvent?.submittedByEmail || '').trim().toLowerCase();
  const eventTitle = updatedEvent?.title ?? updatedEvent?.name ?? 'Event';
  const eventId = String(updatedEvent?._id ?? id);

  if (organizerEmail) {
    const notificationType =
      normalizedStatus === 'approved'
        ? 'event_approved'
        : normalizedStatus === 'rejected'
          ? 'event_rejected'
          : 'event_changes_requested';

    await createUserNotification({
      userEmail: organizerEmail,
      eventId,
      eventTitle,
      type: notificationType,
      message: comment?.trim() || undefined,
    });
  }

  return mapEventDetail(updatedEvent);
}

/**
 * Updates the certificate template path stored on an event document.
 * Called when an admin uploads a custom certificate background image.
 */
export async function updateEventTemplate(
  id: string,
  templateFilePath: string,
  templateUrl: string,
) {
  const events = await getEventsCollection();
  const objectId = toObjectId(id);
  const existingEvent = await events.findOne({ _id: objectId });

  if (!existingEvent) {
    throw createAppError('NotFoundError', 'Event not found', 404);
  }

  await events.updateOne(
    { _id: objectId },
    {
      $set: {
        eCertificateTemplate: templateUrl,
        eCertificateTemplatePath: templateFilePath,
        updatedAt: new Date(),
      },
    },
  );

  return { id, templateUrl };
}

/**
 * Appends an admin comment to an event without changing its approval status.
 */
export async function postAdminComment(id: string, comment: string) {
  if (!comment.trim()) {
    throw createAppError('ValidationError', 'comment is required', 400);
  }

  const events = await getEventsCollection();
  const objectId = toObjectId(id);
  const commentUpdate: any = {
    $push: {
      adminComments: {
        message: comment.trim(),
        createdAt: new Date(),
      },
    },
    $set: {
      updatedAt: new Date(),
    },
  };

  const result = await events.updateOne({ _id: objectId }, commentUpdate);

  if (result.matchedCount === 0) {
    throw createAppError('NotFoundError', 'Event not found', 404);
  }

  const updatedEvent = await events.findOne({ _id: objectId });
  return mapEventDetail(updatedEvent);
}

