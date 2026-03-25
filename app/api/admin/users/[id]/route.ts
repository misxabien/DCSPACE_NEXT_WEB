import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import {
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
  updateUser,
} from "../../../../../lib/admin/db/users";

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

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const { id } = context.params;
    const body = await request.json();
    const action = body?.action ? String(body.action) : "edit";

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
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
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
