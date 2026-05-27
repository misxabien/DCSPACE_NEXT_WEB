import { NextResponse } from 'next/server';
import { getUserDb } from '@/lib/user-server/get-user-db';

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
  submittedByEmail?: string;
  school?: string;
  courseCode?: string;
  courseOrganizer?: string;
  duration?: string;
  minAttendance?: string;
};

function toEventResponse(event: EventDoc) {
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

function validateCreateEventBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return 'Invalid request body.';
  }

  const payload = body as Record<string, unknown>;
  for (const field of ['eventName', 'date', 'venue']) {
    if (!payload[field] || String(payload[field]).trim() === '') {
      return `${field} is required.`;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validateCreateEventBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const db = await getUserDb();
    const newEvent = {
      title: String(payload.eventName || '').trim(),
      date: String(payload.date || '').trim(),
      venue: String(payload.venue || '').trim(),
      description: String(payload.description || '').trim(),
      requester: String(payload.requester || '').trim(),
      department: String(payload.department || '').trim(),
      school: String(payload.school || '').trim(),
      courseCode: String(payload.courseCode || '').trim(),
      courseOrganizer: String(payload.courseOrganizer || '').trim(),
      submittedByEmail: String(payload.submittedByEmail || '')
        .trim()
        .toLowerCase(),
      startTime: String(payload.startTime || '').trim(),
      endTime: String(payload.endTime || '').trim(),
      duration: String(payload.duration || '').trim(),
      minAttendance: String(payload.minAttendance || '').trim(),
      posterImage: String(payload.posterImage || '').trim(),
      status: 'pending',
      certificate: 'Processing',
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection('events').insertOne(newEvent);
    return NextResponse.json(
      {
        message: 'Event created successfully.',
        event: toEventResponse({ ...newEvent, _id: result.insertedId }),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create event.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get('search') || '').trim();
    const department = String(searchParams.get('department') || '').trim();
    const submittedByEmail = String(searchParams.get('submittedByEmail') || '')
      .trim()
      .toLowerCase();
    const statusParam = String(searchParams.get('status') || 'approved')
      .trim()
      .toLowerCase();
    const query: Record<string, unknown> = {};

    if (statusParam !== 'all') {
      query.status = statusParam;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { requester: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      query.department = { $regex: `^${department}$`, $options: 'i' };
    }

    if (submittedByEmail) {
      query.submittedByEmail = submittedByEmail;
    }

    const db = await getUserDb();
    const rows = await db.collection('events').find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ events: rows.map((row) => toEventResponse(row as EventDoc)) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch events.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
