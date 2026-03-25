import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { getNotifications } from "../../../../lib/admin/db/notifications";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();

    const notifications = await getNotifications();

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
