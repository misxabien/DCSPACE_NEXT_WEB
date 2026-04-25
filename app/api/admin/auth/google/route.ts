import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildSessionPayload,
  getGoogleSsoConfig,
  isAllowedGoogleEmail,
} from "../../../../../lib/admin/auth/authOptions";
import { findUserByEmail } from "../../../../../lib/admin/db/users";

/**
 * Handles Google SSO registration checks before creating an admin session payload.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (!isAllowedGoogleEmail(body.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await findUserByEmail(body.email);

    if (!user) {
      return NextResponse.json(
        {
          error: "User is not registered",
          redirectTo: "/register",
          sso: getGoogleSsoConfig(typeof body.callbackUrl === "string" ? body.callbackUrl : undefined),
        },
        { status: 404 },
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ...buildSessionPayload(user, typeof body.callbackUrl === "string" ? body.callbackUrl : undefined),
        sso: getGoogleSsoConfig(typeof body.callbackUrl === "string" ? body.callbackUrl : undefined),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Google auth pre-check failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
