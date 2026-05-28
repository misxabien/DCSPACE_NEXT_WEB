/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import { getUserDb } from '@/lib/user-server/get-user-db';

async function getDatabase() {
  return getUserDb();
}

export type UserNotificationType =
  | 'event_approved'
  | 'event_rejected'
  | 'event_changes_requested'
  | 'certificate_ready';

export type UserNotificationRecord = {
  id: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  type: UserNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function mapNotification(doc: any): UserNotificationRecord {
  return {
    id: String(doc._id),
    userEmail: String(doc.userEmail || ''),
    eventId: String(doc.eventId || ''),
    eventTitle: String(doc.eventTitle || 'Event'),
    type: doc.type as UserNotificationType,
    title: String(doc.title || ''),
    message: String(doc.message || ''),
    read: Boolean(doc.read),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt || new Date().toISOString()),
  };
}

export async function createUserNotification(input: {
  userEmail: string;
  eventId: string;
  eventTitle: string;
  type: UserNotificationType;
  message?: string;
}) {
  const email = input.userEmail.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const title =
    input.type === 'event_approved'
      ? 'Event Approved'
      : input.type === 'event_rejected'
        ? 'Event Rejected'
        : input.type === 'certificate_ready'
          ? 'Certificate Ready'
          : 'Changes Requested';

  const db = await getDatabase();
  const result = await db.collection('user_notifications').insertOne({
    userEmail: email,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    type: input.type,
    title,
    message: input.message?.trim() || '',
    read: false,
    createdAt: new Date(),
  });

  return mapNotification({
    _id: result.insertedId,
    userEmail: email,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    type: input.type,
    title,
    message: input.message?.trim() || '',
    read: false,
    createdAt: new Date(),
  });
}

export async function getUserNotificationsForEmail(userEmail: string, limit = 50) {
  const email = userEmail.trim().toLowerCase();
  if (!email) {
    return [];
  }

  const db = await getDatabase();
  const rows = await db
    .collection('user_notifications')
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return rows.map(mapNotification);
}

export async function markUserNotificationsRead(userEmail: string, ids: string[]) {
  const email = userEmail.trim().toLowerCase();
  if (!email || ids.length === 0) {
    return;
  }

  const db = await getDatabase();
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

  if (objectIds.length === 0) {
    return;
  }

  await db.collection('user_notifications').updateMany(
    { userEmail: email, _id: { $in: objectIds } },
    { $set: { read: true, readAt: new Date() } },
  );
}
