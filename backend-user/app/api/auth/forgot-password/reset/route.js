import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSchoolEmail } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { verifyPasswordResetCode } from "@/lib/verification";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!email || !code || !password || !confirmPassword) {
      return withCors(
        NextResponse.json({ error: "email, code, password, and confirmPassword are required." }, { status: 400 }),
      );
    }
    if (!isSchoolEmail(email)) {
      return withCors(NextResponse.json({ error: "email must use your school domain (@sdca.edu.ph)." }, { status: 400 }));
    }
    if (password.length < 8) {
      return withCors(NextResponse.json({ error: "password must be at least 8 characters." }, { status: 400 }));
    }
    if (password !== confirmPassword) {
      return withCors(NextResponse.json({ error: "password and confirmPassword do not match." }, { status: 400 }));
    }

    const verification = await verifyPasswordResetCode(email, code, { consume: true });
    if (!verification.ok) {
      return withCors(NextResponse.json({ error: verification.error }, { status: 400 }));
    }

    const db = await getDb();
    const result = await db.collection("users").updateOne(
      { email },
      {
        $set: {
          passwordHash: hashPassword(password),
          updatedAt: new Date().toISOString(),
        },
      },
    );
    if (!result.matchedCount) {
      return withCors(NextResponse.json({ error: "No account found for this email." }, { status: 404 }));
    }

    return withCors(NextResponse.json({ message: "Password reset successful. You can now sign in." }, { status: 200 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        { error: "Failed to reset password.", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      ),
    );
  }
}
