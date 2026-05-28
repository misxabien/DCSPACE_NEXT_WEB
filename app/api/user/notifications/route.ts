import { NextResponse } from 'next/server';
import { getUserNotificationsForEmail } from '@/lib/admin/db/user-notifications';
import { requireUserAuth } from '@/lib/user-server/require-user-auth';

export async function GET(request: Request) {
  try {
    const authResult = await requireUserAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const email = String(authResult.user.email || '').trim().toLowerCase();
    const notifications = await getUserNotificationsForEmail(email);

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
