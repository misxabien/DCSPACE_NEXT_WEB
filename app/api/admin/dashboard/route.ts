import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import {
  getCertificateQueue,
  getDashboardStats,
  getUpcomingEvents,
} from "../../../../lib/admin/db/dashboard";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();

    const [stats, certificateQueue, upcomingEvents] = await Promise.all([
      getDashboardStats(),
      getCertificateQueue(),
      getUpcomingEvents(),
    ]);

    return NextResponse.json(
      {
        ...stats,
        certificateQueue,
        upcomingEvents,
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
