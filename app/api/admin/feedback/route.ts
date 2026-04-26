import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { getFeedbackOverview } from "../../../../lib/admin/db/feedback";
import { toErrorResponse } from "../../../../lib/admin/errors";

/**
 * Returns the feedback overview stats and table rows for the admin feedback screen.
 */
export async function GET() {
  try {
    await requireAdmin();

    const feedbackOverview = await getFeedbackOverview();
    return NextResponse.json(feedbackOverview, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
