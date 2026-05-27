import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAllowedGoogleEmail } from "@/lib/admin/auth/authOptions";
import { sanitizeUser } from "@/lib/auth-helpers";
import { getDb } from "@/lib/db";
import { signAuthToken } from "@/lib/token";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = String(session?.user?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Google session was not found." }, { status: 401 });
    }

    if (!isAllowedGoogleEmail(email)) {
      return NextResponse.json({ error: "Please use your SDCA Gmail account to sign in." }, { status: 403 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "No registered account was found for this Google email." }, { status: 404 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: "This account is inactive." }, { status: 403 });
    }

    const token = signAuthToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role || "student",
    });

    return NextResponse.json({
      message: "Google login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to complete Google login.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
