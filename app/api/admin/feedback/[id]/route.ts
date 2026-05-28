import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { getFeedbackById, updateFeedbackRecord } from '@/lib/admin/db/feedback';
import { toErrorResponse } from '@/lib/admin/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Returns full feedback detail for the admin modal.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const detail = await getFeedbackById(id);

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Updates feedback status and/or adds an admin note.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminSession = await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const status =
      body.status === 'new' || body.status === 'actioned' || body.status === 'reviewed'
        ? body.status
        : undefined;
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote : undefined;

    if (!status && !adminNote?.trim()) {
      return NextResponse.json(
        { error: 'Provide status and/or adminNote to update.' },
        { status: 400 },
      );
    }

    const detail = await updateFeedbackRecord(id, {
      status,
      adminNote,
      adminEmail: adminSession.user.email ?? undefined,
    });

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
