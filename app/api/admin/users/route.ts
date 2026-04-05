import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { createUser, getUsers } from "../../../../lib/admin/db/users";

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
    const users = await getUsers({
      search: searchParams.get("search"),
      role: searchParams.get("role"),
      status: searchParams.get("status"),
      organization: searchParams.get("organization"),
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 10),
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { error: "name, email, and role are required" },
        { status: 400 },
      );
    }

    const user = await createUser({
      name: String(body.name),
      email: String(body.email),
      role: String(body.role),
      organization: typeof body.organization === "string" ? body.organization : null,
      studentId: typeof body.studentId === "string" ? body.studentId : null,
      rfid: typeof body.rfid === "string" ? body.rfid : null,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
      password: typeof body.password === "string" ? body.password : undefined,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}