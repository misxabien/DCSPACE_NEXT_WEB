import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { getEvents } from '@/lib/admin/db/events';

function toErrorResponse(error: unknown) {
  console.error('[api/admin/events] GET failed', error);

  if (error instanceof Error && error.name === 'AdminAuthorizationError') {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Internal Server Error';
  const isConnectionError =
    /ENOTFOUND|ECONNREFUSED|ssl|tls|querySrv|MongoNetworkError/i.test(message);

  return NextResponse.json(
    {
      error: isConnectionError
        ? 'Database connection issue. Check Atlas Network Access / DNS and MONGODB_URI.'
        : message || 'Internal Server Error',
    },
    { status: 500 },
  );
}

function isMongoConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /ENOTFOUND|ECONNREFUSED|ssl|tls|querySrv|MongoNetworkError/i.test(message);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const events = await getEvents({
      status: searchParams.get('status') ?? 'all',
      search: searchParams.get('search'),
      filter: searchParams.get('filter'),
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 50),
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json(
        {
          events: [],
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
            showingFrom: 0,
            showingTo: 0,
          },
          warning: 'Database connection unavailable. Showing empty result until MongoDB reconnects.',
        },
        { status: 200 },
      );
    }

    return toErrorResponse(error);
  }
}
