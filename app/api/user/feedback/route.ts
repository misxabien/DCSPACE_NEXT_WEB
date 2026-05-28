import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createFeedbackSubmission } from '@/lib/admin/db/feedback';
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
 * Submits feedback from the user dashboard. Appears immediately in admin Feedback Overview.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireUserAuth(request);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const feedbackType = body.feedbackType;

    if (feedbackType !== 'event' && feedbackType !== 'general' && feedbackType !== 'issue') {
      return NextResponse.json({ error: 'Invalid feedback type.' }, { status: 400 });
    }

    const comment = typeof body.comment === 'string' ? body.comment : '';
    const eventId = typeof body.eventId === 'string' ? body.eventId : '';
    const rating = typeof body.rating === 'number' ? body.rating : Number(body.rating);

    const result = await createFeedbackSubmission({
      userId: authResult.user._id.toString(),
      userEmail: authResult.user.email,
      user: {
        firstName: authResult.user.firstName,
        lastName: authResult.user.lastName,
        studentNumber: authResult.user.studentNumber,
        course: authResult.user.course,
        school: authResult.user.school,
        organizationPart: authResult.user.organizationPart,
        organizationRole: authResult.user.organizationRole,
      },
      feedbackType,
      eventId,
      rating: Number.isFinite(rating) ? rating : undefined,
      comment,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
