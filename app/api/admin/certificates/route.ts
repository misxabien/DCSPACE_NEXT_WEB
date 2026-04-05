import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { getAttendeesByEvent } from "../../../../lib/admin/db/certificates";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof Error && error.name === "ValidationError") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof Error && error.name === "NotFoundError") {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

/**
 * Returns the attendee table for a single event in the E-Certificate and Attendance screen.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");

    if (!eventId?.trim()) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const data = await getAttendeesByEvent(eventId, searchParams.get("search"));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
