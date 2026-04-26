import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import { getCertAttendanceByEvent } from "../../../../../lib/admin/db/certificates";
import { toErrorResponse } from "../../../../../lib/admin/errors";

/**
 * Returns per-student attendance and certificate records for a specific event.
 * Used by the E-Certificate & Attendance screen (v2 path-param variant).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    await requireAdmin();

    const { eventId } = await context.params;

    if (!eventId?.trim()) {
      return NextResponse.json(
        { error: "eventId is required", code: 400 },
        { status: 400 },
      );
    }

    const search = request.nextUrl.searchParams.get("search");
    const data = await getCertAttendanceByEvent(eventId, search);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
