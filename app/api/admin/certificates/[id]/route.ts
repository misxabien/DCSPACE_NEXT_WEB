import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import { toggleAttendeeStatus } from "../../../../../lib/admin/db/certificates";

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
 * Toggles the active attendance status of an attendee within a specific event.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    const nextStatus = typeof body.toggleActive === "boolean" ? body.toggleActive : undefined;

    if (!id) {
      return NextResponse.json({ error: "Attendee id is required" }, { status: 400 });
    }

    if (!eventId.trim()) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const attendee = await toggleAttendeeStatus(id, eventId, nextStatus);
    return NextResponse.json(attendee, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

