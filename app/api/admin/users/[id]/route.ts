import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import {
  assignToEvent,
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
  updateUser,
} from "../../../../../lib/admin/db/users";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (
    error instanceof Error &&
    (error.name === "ValidationError" || error.name === "AuthenticationError")
  ) {
    return NextResponse.json({ error: error.message }, { status: error.name === "AuthenticationError" ? 401 : 400 });
  }

  if (error instanceof Error && (error.name === "NotFoundError" || error.name === "AuthorizationError")) {
    return NextResponse.json({ error: error.message }, { status: error.name === "NotFoundError" ? 404 : 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const { id } = context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "edit";

    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    if (action === "toggle") {
      const user = await toggleUserStatus(
        id,
        body.isActive === undefined ? undefined : Boolean(body.isActive),
      );
      return NextResponse.json(user, { status: 200 });
    }

    if (action === "resetPassword") {
      const result = await resetUserPassword(id);
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "assignToEvent") {
      if (typeof body.eventId !== "string") {
        return NextResponse.json({ error: "eventId is required" }, { status: 400 });
      }

      const result = await assignToEvent(id, { eventId: body.eventId });
      return NextResponse.json(result, { status: 200 });
    }

    const updatedUser = await updateUser(id, {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.email !== undefined ? { email: String(body.email) } : {}),
      ...(body.role !== undefined ? { role: String(body.role) } : {}),
      ...(body.organization !== undefined
        ? { organization: body.organization ? String(body.organization) : null }
        : {}),
      ...(body.studentId !== undefined
        ? { studentId: body.studentId ? String(body.studentId) : null }
        : {}),
      ...(body.rfid !== undefined ? { rfid: body.rfid ? String(body.rfid) : null } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.registrationStatus !== undefined
        ? { registrationStatus: String(body.registrationStatus) }
        : {}),
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const result = await deleteUser(id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}