import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDatabaseAvailable } from "@/lib/db-availability";
import { isSchoolEmail } from "@/lib/auth-helpers";
import { issueRegistrationVerificationCode } from "@/lib/verification";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

function formatSendError(error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const isDatabaseError =
    /mongo|ssl|tls|topology|ECONNREFUSED/i.test(message) ||
    (error && typeof error === "object" && "name" in error && String(error.name).includes("Mongo"));
  const isEmailConfigError =
    /email delivery is not configured|mail server|verification email/i.test(message);

  if (isDatabaseError) {
    return {
      status: 500,
      error: "Could not connect to the database. Check MONGODB_URI in backend-user/.env.",
      details: message,
    };
  }

  if (isEmailConfigError) {
    return {
      status: 503,
      error: message,
      details: message,
    };
  }

  return {
    status: 500,
    error: "Failed to send verification email.",
    details: message,
  };
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * Sends a 6-digit verification code to the user's school email before registration.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return withCors(NextResponse.json({ error: "email is required." }, { status: 400 }));
    }

    if (!isSchoolEmail(email)) {
      return withCors(
        NextResponse.json({ error: "email must use your school domain (@sdca.edu.ph)." }, { status: 400 }),
      );
    }

    if (await isDatabaseAvailable()) {
      const db = await getDb();
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return withCors(
          NextResponse.json({ error: "An account with this email already exists." }, { status: 409 }),
        );
      }
    }

    const result = await issueRegistrationVerificationCode(email);

    if (!result.delivered) {
      return withCors(
        NextResponse.json(
          { error: "Verification email could not be delivered. Please try again later." },
          { status: 500 },
        ),
      );
    }

    const payload = {
      message: result.devMode
        ? "Verification code generated. Check the backend-user terminal (SMTP is not configured)."
        : "Verification code sent. Please check your school email inbox (and spam folder).",
      email: result.email,
      expiresAt: result.expiresAt,
    };

    if (result.devMode && process.env.VERIFICATION_EXPOSE_CODE_IN_RESPONSE === "true") {
      payload.devCode = result.code;
    }

    return withCors(NextResponse.json(payload, { status: 200 }));
  } catch (error) {
    const formatted = formatSendError(error);
    return withCors(
      NextResponse.json(
        { error: formatted.error, details: formatted.details },
        { status: formatted.status },
      ),
    );
  }
}
