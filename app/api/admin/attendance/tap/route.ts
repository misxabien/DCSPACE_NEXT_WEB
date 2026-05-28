import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { recordAttendanceTapForEvent } from '@/lib/admin/db/certificates';

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === 'AdminAuthorizationError') {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof Error && error.name === 'NotFoundError') {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/**
 * Admin RFID kiosk tap-in / tap-out for an event.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = (await request.json()) as Record<string, unknown>;
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    const rfidNumber = typeof body.rfidNumber === 'string' ? body.rfidNumber.trim() : '';
    const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
    const eventDate = typeof body.eventDate === 'string' ? body.eventDate.trim() : '';

    if (!eventId || !rfidNumber) {
      return NextResponse.json(
        { error: 'eventId and rfidNumber are required' },
        { status: 400 },
      );
    }

    const result = await recordAttendanceTapForEvent({
      eventId,
      rfidNumber,
      eventName,
      eventDate,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
