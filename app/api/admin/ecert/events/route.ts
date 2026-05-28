import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { listEcertEvents } from '@/lib/admin/db/certificates';

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === 'AdminAuthorizationError') {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/**
 * Lists approved events for the admin E-Certificate screen.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const search = request.nextUrl.searchParams.get('search');
    const data = await listEcertEvents(search);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
