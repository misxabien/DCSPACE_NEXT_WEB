import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSchoolEmail, sanitizeUser } from "@/lib/auth-helpers";
import { verifyPassword } from "@/lib/password";
import { signAuthToken } from "@/lib/token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required." }, { status: 400 });
    }

    if (!isSchoolEmail(email)) {
      return NextResponse.json({ error: "Only @sdca.edu.ph email accounts are allowed." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = signAuthToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role || "student",
    });

    return NextResponse.json({ message: "Login successful.", token, user: sanitizeUser(user) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to login.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
