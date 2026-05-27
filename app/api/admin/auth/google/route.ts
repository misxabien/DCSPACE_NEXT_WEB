import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildSessionPayload,
  getGoogleSsoConfig,
  isAllowedGoogleEmail,
} from "../../../../../lib/admin/auth/authOptions";
import { buildHardcodedAdminUser, getDevAdminConfig } from "../../../../../lib/admin/auth/devAdmin";

/**
 * Handles Google SSO checks for hardcoded admin mode.
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

    const adminEmail = getDevAdminConfig().email;
    if (body.email.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = buildHardcodedAdminUser();

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