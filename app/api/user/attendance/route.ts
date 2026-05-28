import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { recordAttendanceTapForEvent } from '@/lib/admin/db/certificates';
import { requireUserAuth } from '@/lib/user-server/require-user-auth';

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof Error && error.name === 'NotFoundError') {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/**
 * Records RFID tap-in / tap-out and returns attendance logs for the signed-in user.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireUserAuth(request);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
    const eventDate = typeof body.eventDate === 'string' ? body.eventDate.trim() : '';
    const rfidFromBody = typeof body.rfidNumber === 'string' ? body.rfidNumber.trim() : '';
    const rfidNumber = rfidFromBody || authResult.user.rfidNumber?.trim() || '';

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (!rfidNumber) {
      return NextResponse.json({ error: 'rfidNumber is required' }, { status: 400 });
    }

    const result = await recordAttendanceTapForEvent({
      eventId,
      eventName,
      eventDate,
      rfidNumber,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireUserAuth(request);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { getUserDb } = await import('@/lib/user-server/get-user-db');

    const db = await getUserDb();
    const userId = authResult.user._id;
    const studentNumber = authResult.user.studentNumber;

    const rows = await db
      .collection('attendance_logs')
      .find({
        $or: [
          { userId: String(userId) },
          { userId },
          { studentNumber },
        ],
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(200)
      .toArray();

    const attendance = rows.map((row) => ({
      eventId: String(row.eventId ?? ''),
      eventName: String(row.eventName ?? ''),
      eventDate: String(row.eventDate ?? ''),
      studentNumber: String(row.studentNumber ?? studentNumber ?? ''),
      rfidNumber: String(row.rfidNumber ?? authResult.user.rfidNumber ?? ''),
      tapIn: row.tapIn ? String(row.tapIn) : undefined,
      tapOut: row.tapOut ? String(row.tapOut) : undefined,
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : row.updatedAt
            ? String(row.updatedAt)
            : undefined,
    }));

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
