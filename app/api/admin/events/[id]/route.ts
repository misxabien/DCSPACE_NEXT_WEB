import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import {
  getEventById,
  postAdminComment,
  updateEventStatus,
} from "../../../../../lib/admin/db/events";

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

function mapActionToStatus(action: string) {
  switch (action) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "requestChanges":
      return "changes_requested";
    default:
      return null;
  }
}

/**
 * Returns the full event detail for the admin pending and approved event views.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    const event = await getEventById(id);
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Handles moderation actions and admin comments for an event.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "comment";
    const comment = typeof body.comment === "string" ? body.comment : undefined;

    if (!id) {
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    const nextStatus = mapActionToStatus(action);

    if (nextStatus) {
      const updatedEvent = await updateEventStatus(id, nextStatus, comment);
      return NextResponse.json(updatedEvent, { status: 200 });
    }

    if (action === "comment") {
      if (!comment?.trim()) {
        return NextResponse.json({ error: "comment is required" }, { status: 400 });
      }

      const updatedEvent = await postAdminComment(id, comment);
      return NextResponse.json(updatedEvent, { status: 200 });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
