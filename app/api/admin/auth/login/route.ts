import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildSessionPayload } from "../../../../../lib/admin/auth/authOptions";
import { loginUser } from "../../../../../lib/admin/db/users";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AuthenticationError") {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof Error && error.name === "AuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

/**
 * Handles admin email and password login against MongoDB.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    const user = await loginUser({
      email: body.email,
      password: body.password,
      requireAdmin: true,
    });

    return NextResponse.json(buildSessionPayload(user, typeof body.callbackUrl === "string" ? body.callbackUrl : undefined), {
      status: 200,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}