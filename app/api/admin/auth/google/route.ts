import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildSessionPayload,
  getGoogleSsoConfig,
  isAllowedGoogleEmail,
} from "@/lib/admin/auth/authOptions";
import { findUserByEmail } from "@/lib/admin/db/users";
import { buildHardcodedAdminUser, getDevAdminConfig } from "@/lib/admin/auth/devAdmin";

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

    const email = body.email.trim().toLowerCase();
    const registeredUser = await findUserByEmail(email);
    const devAdminEmail = getDevAdminConfig().email;
    const user = registeredUser ?? (email === devAdminEmail ? buildHardcodedAdminUser() : null);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ...buildSessionPayload(user, typeof body.callbackUrl === "string" ? body.callbackUrl : undefined),
        sso: getGoogleSsoConfig(typeof body.callbackUrl === "string" ? body.callbackUrl : undefined),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
