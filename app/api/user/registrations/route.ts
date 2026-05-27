import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getUserDb } from '@/lib/user-server/get-user-db';
import { requireUserAuth } from '@/lib/user-server/require-user-auth';
import {
  toEventSnapshot,
  toRegistrationResponse,
  validateEventRegistrationBody,
} from '@/lib/user-server/registration-helpers';

export async function GET(request: Request) {
  try {
    const authResult = await requireUserAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = await getUserDb();
    const userId = authResult.user._id.toString();
    const { searchParams } = new URL(request.url);
    const eventId = String(searchParams.get('eventId') || '').trim();
    const query: Record<string, string> = {};

    if (eventId) {
      if (!ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: 'Invalid eventId.' }, { status: 400 });
      }

      const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
      if (!event) {
        return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
      }

      const userEmail = String(authResult.user.email || '').trim().toLowerCase();
      const submitterEmail = String(event.submittedByEmail || '').trim().toLowerCase();
      const role = String(authResult.user.organizationRole || '').toLowerCase();
      const isOfficer = role.includes('officer');

      if (submitterEmail && submitterEmail !== userEmail && !isOfficer) {
        return NextResponse.json(
          { error: 'You can only review registrations for your own events.' },
          { status: 403 },
        );
      }

      query.eventId = eventId;
    } else {
      query.userId = userId;
    }

    const rows = await db
      .collection('event_registrations')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        registrations: rows.map((row) =>
          toRegistrationResponse(row as unknown as Parameters<typeof toRegistrationResponse>[0]),
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch registrations.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireUserAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationError = validateEventRegistrationBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const eventId = String(body.eventId).trim();
    const db = await getUserDb();
    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const userId = authResult.user._id.toString();
    const existing = await db.collection('event_registrations').findOne({ userId, eventId });
    const requirementFiles = Array.isArray(body.requirementFiles)
      ? body.requirementFiles.map((file: { requirementName?: string; name?: string; type?: string; size?: number }) => ({
          requirementName: String(file?.requirementName || '').trim(),
          name: String(file?.name || '').trim(),
          type: String(file?.type || '').trim(),
          size: Number(file?.size) || 0,
        }))
      : [];

    if (existing) {
      const updates: Record<string, unknown> = {
        eventSnapshot: toEventSnapshot(event as Parameters<typeof toEventSnapshot>[0]),
        updatedAt: new Date().toISOString(),
      };
      if (requirementFiles.length > 0) {
        updates.requirementFiles = requirementFiles;
      }

      await db.collection('event_registrations').updateOne({ _id: existing._id }, { $set: updates });
      const saved = await db.collection('event_registrations').findOne({ _id: existing._id });
      return NextResponse.json(
        {
          message: 'Registration updated.',
          registration: toRegistrationResponse(saved as unknown as Parameters<typeof toRegistrationResponse>[0]),
        },
        { status: 200 },
      );
    }

    const registration = {
      userId,
      eventId,
      eventSnapshot: toEventSnapshot(event as Parameters<typeof toEventSnapshot>[0]),
      userSnapshot: {
        id: userId,
        firstName: String(authResult.user.firstName || '').trim(),
        lastName: String(authResult.user.lastName || '').trim(),
        email: String(authResult.user.email || '').trim().toLowerCase(),
        studentNumber: String(authResult.user.studentNumber || '').trim(),
        course: String(authResult.user.course || '').trim(),
        school: String(authResult.user.school || '').trim(),
        organization: String(authResult.user.organizationPart || '').trim(),
        organizationRole: String(authResult.user.organizationRole || '').trim(),
        rfidNumber: String(authResult.user.rfidNumber || '').trim(),
      },
      requirementFiles,
      status: 'Registered',
      certificate: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection('event_registrations').insertOne(registration);
    const saved = { ...registration, _id: result.insertedId };

    return NextResponse.json(
      {
        message: 'Registered for event.',
        registration: toRegistrationResponse(saved as Parameters<typeof toRegistrationResponse>[0]),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to register for event.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
