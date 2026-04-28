import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSchoolEmail, sanitizeUser } from "@/lib/auth-helpers";
import { verifyPassword } from "@/lib/password";
import { signAuthToken } from "@/lib/token";

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
    const password = String(body.password || "");
    if (!email || !password) {
      return withCors(NextResponse.json({ error: "email and password are required." }, { status: 400 }));
    }
    if (!isSchoolEmail(email)) {
      return withCors(NextResponse.json({ error: "Only @sdca.edu.ph email accounts are allowed." }, { status: 400 }));
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return withCors(NextResponse.json({ error: "Invalid email or password." }, { status: 401 }));
    }

    const token = signAuthToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role || "student",
    });
    return withCors(NextResponse.json({ message: "Login successful.", token, user: sanitizeUser(user) }, { status: 200 }));
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return withCors(
      NextResponse.json(
        { error: "Failed to login.", details },
        { status: 500 },
      ),
    );
  }
}