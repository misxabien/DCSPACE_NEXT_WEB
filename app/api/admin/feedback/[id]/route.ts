import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import {
  getFeedbackById,
  sendFeedbackEmail,
  updateFeedback,
} from "../../../../../lib/admin/db/feedback";
import { toErrorResponse } from "../../../../../lib/admin/errors";

/**
 * Returns the full feedback detail with user info and event details.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Feedback id is required", code: 400 },
        { status: 400 },
      );
    }

    const data = await getFeedbackById(id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Updates feedback status and/or admin note, or triggers a follow-up email.
 *
 * PATCH body: { status?: 'New' | 'Actioned' | 'Reviewed', adminNote?: string }
 * POST  body: { message?: string }  — triggers email
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    if (!id) {
      return NextResponse.json(
        { error: "Feedback id is required", code: 400 },
        { status: 400 },
      );
    }

    const result = await updateFeedback(id, {
      status: typeof body.status === "string" ? body.status : undefined,
      adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Triggers a follow-up email to the feedback submitter.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    if (!id) {
      return NextResponse.json(
        { error: "Feedback id is required", code: 400 },
        { status: 400 },
      );
    }

    const result = await sendFeedbackEmail(
      id,
      typeof body.message === "string" ? body.message : undefined,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
