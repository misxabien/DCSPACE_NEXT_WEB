import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { registerUser } from "../../../../../lib/admin/db/users";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "ValidationError") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

/**
 * Registers a new user before email/password or Google SSO login can succeed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (
      typeof body.name !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 },
      );
    }

    const user = await registerUser({
      name: body.name,
      email: body.email,
      password: body.password,
      role: typeof body.role === "string" ? body.role : undefined,
      organization: typeof body.organization === "string" ? body.organization : null,
      studentId: typeof body.studentId === "string" ? body.studentId : null,
      rfid: typeof body.rfid === "string" ? body.rfid : null,
      googleId: typeof body.googleId === "string" ? body.googleId : null,
    });

    return NextResponse.json(
      {
        user,
        redirectTo: "/login",
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}