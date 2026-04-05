import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { getEvents } from "../../../../lib/admin/db/events";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof Error && error.name === "ValidationError") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const events = await getEvents({
      status: searchParams.get("status") ?? "all",
      search: searchParams.get("search"),
      filter: searchParams.get("filter"),
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 10),
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}