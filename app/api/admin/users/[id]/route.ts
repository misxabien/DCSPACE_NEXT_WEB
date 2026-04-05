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
    return NextResponse.json(
      { error: error.message },
      { status: error.name === "AuthenticationError" ? 401 : 400 },
    );
  }

  if (
    error instanceof Error &&
    (error.name === "NotFoundError" || error.name === "AuthorizationError")
  ) {
    return NextResponse.json(
      { error: error.message },
      { status: error.name === "NotFoundError" ? 404 : 403 },
    );
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

function hasEditableFields(body: Record<string, unknown>) {
  return [
    "name",
    "email",
    "role",
    "organization",
    "studentId",
    "rfid",
    "isActive",
    "registrationStatus",
  ].some((key) => body[key] !== undefined);
}

function normalizeUserAction(body: Record<string, unknown>) {
  const rawAction = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

  if (rawAction === "edit" || rawAction === "edituser") {
    return "editUser" as const;
  }

  if (rawAction === "toggle" || rawAction === "togglestatus") {
    return "toggleStatus" as const;
  }

  if (rawAction === "resetpassword") {
    return "resetPassword" as const;
  }

  if (rawAction === "assigntoevent") {
    return "assignToEvent" as const;
  }

  if (!rawAction && hasEditableFields(body)) {
    return "editUser" as const;
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = normalizeUserAction(body);

    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    if (action === "toggleStatus") {
      const user = await toggleUserStatus(
        id,
        body.isActive === undefined ? undefined : Boolean(body.isActive),
      );
      return NextResponse.json({ action, user }, { status: 200 });
    }

    if (action === "resetPassword") {
      const result = await resetUserPassword(id);
      return NextResponse.json({ action, ...result }, { status: 200 });
    }

    if (action === "assignToEvent") {
      if (typeof body.eventId !== "string") {
        return NextResponse.json({ error: "eventId is required" }, { status: 400 });
      }

      const result = await assignToEvent(id, { eventId: body.eventId });
      return NextResponse.json({ action, ...result }, { status: 200 });
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

    return NextResponse.json({ action, user: updatedUser }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const result = await deleteUser(id);

    return NextResponse.json({ action: "deleteUser", ...result }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
