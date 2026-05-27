import { ObjectId } from 'mongodb';

type EventDoc = {
  _id: { toString(): string };
  title?: string;
  date?: string;
  venue?: string;
  description?: string;
  requester?: string;
  department?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  certificate?: string;
  posterImage?: string;
  createdAt?: string;
};

type RegistrationDoc = {
  _id: { toString(): string };
  eventId: string;
  status?: string;
  certificate?: string;
  requirementFiles?: Array<{
    requirementName?: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  userSnapshot?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    course?: string;
    organization?: string;
  };
  eventSnapshot?: Record<string, unknown>;
  createdAt?: string;
};

export function toEventSnapshot(event: EventDoc) {
  return {
    id: event._id.toString(),
    title: event.title || '',
    date: event.date || '',
    venue: event.venue || '',
    description: event.description || '',
    requester: event.requester || '',
    department: event.department || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    status: event.status || 'pending',
    certificate: event.certificate || 'Processing',
    posterImage: event.posterImage || '',
    createdAt: event.createdAt || new Date().toISOString(),
  };
}

export function toRegistrationResponse(registration: RegistrationDoc) {
  const snapshot = registration.eventSnapshot || {};
  const userSnapshot = registration.userSnapshot || {};

  return {
    id: registration._id.toString(),
    eventId: registration.eventId,
    status: registration.status || 'Registered',
    certificate: registration.certificate || 'Pending',
    requirementFiles: registration.requirementFiles || [],
    participantName:
      `${String(userSnapshot.firstName || '').trim()} ${String(userSnapshot.lastName || '').trim()}`.trim() ||
      '',
    participantEmail: String(userSnapshot.email || '').trim().toLowerCase(),
    course: String(userSnapshot.course || '').trim(),
    organization: String(userSnapshot.organization || '').trim(),
    createdAt: registration.createdAt || new Date().toISOString(),
    event: {
      id: String(snapshot.id || registration.eventId || ''),
      title: String(snapshot.title || ''),
      date: String(snapshot.date || ''),
      venue: String(snapshot.venue || ''),
      description: String(snapshot.description || ''),
      requester: String(snapshot.requester || ''),
      department: String(snapshot.department || ''),
      startTime: String(snapshot.startTime || ''),
      endTime: String(snapshot.endTime || ''),
      status: String(snapshot.status || ''),
      certificate: String(snapshot.certificate || ''),
      posterImage: String(snapshot.posterImage || ''),
    },
  };
}

export function validateEventRegistrationBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return 'Invalid request body.';
  }

  const eventId = String((body as { eventId?: unknown }).eventId || '').trim();
  if (!eventId || !ObjectId.isValid(eventId)) {
    return 'A valid eventId is required.';
  }

  return null;
}
