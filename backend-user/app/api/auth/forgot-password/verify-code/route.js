import { NextResponse } from "next/server";
import { isSchoolEmail } from "@/lib/auth-helpers";
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

    if (!email || !code) {
      return withCors(NextResponse.json({ error: "email and code are required." }, { status: 400 }));
    }
    if (!isSchoolEmail(email)) {
      return withCors(NextResponse.json({ error: "email must use your school domain (@sdca.edu.ph)." }, { status: 400 }));
    }

    const result = await verifyPasswordResetCode(email, code, { consume: false });
    if (!result.ok) {
      return withCors(NextResponse.json({ error: result.error }, { status: 400 }));
    }

    return withCors(NextResponse.json({ message: "Verification code is valid." }, { status: 200 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Failed to verify reset code.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}
