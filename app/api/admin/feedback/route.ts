import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { getFeedbackOverview } from "../../../../lib/admin/db/feedback";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

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
