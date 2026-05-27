import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSchoolEmail } from "@/lib/auth-helpers";
import { issuePasswordResetCode } from "@/lib/verification";

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

    if (!email) {
      return withCors(NextResponse.json({ error: "email is required." }, { status: 400 }));
    }
    if (!isSchoolEmail(email)) {
      return withCors(NextResponse.json({ error: "email must use your school domain (@sdca.edu.ph)." }, { status: 400 }));
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return withCors(NextResponse.json({ error: "No account found for this email." }, { status: 404 }));
    }

    const result = await issuePasswordResetCode(email);
    return withCors(
      NextResponse.json(
        {
          message: "Password reset code sent. Please check your email inbox (and spam folder).",
          email: result.email,
          expiresAt: result.expiresAt,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Failed to send reset code.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}
