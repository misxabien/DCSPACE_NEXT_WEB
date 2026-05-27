import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildSessionPayload } from "@/lib/admin/auth/authOptions";
import { loginUser } from "@/lib/admin/db/users";
import { buildHardcodedAdminUser, isHardcodedAdminLogin } from "@/lib/admin/auth/devAdmin";

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
 * Handles MongoDB admin email/password login, with the local dev admin as a fallback.
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

    let user;

    try {
      user = await loginUser({
        email: body.email,
        password: body.password,
        requireAdmin: true,
      });
    } catch (error) {
      if (!isHardcodedAdminLogin(body.email, body.password)) {
        throw error;
      }
      user = buildHardcodedAdminUser();
    }

    return NextResponse.json(buildSessionPayload(user, typeof body.callbackUrl === "string" ? body.callbackUrl : undefined), {
      status: 200,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
