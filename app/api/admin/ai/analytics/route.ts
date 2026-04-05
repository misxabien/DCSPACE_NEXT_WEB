import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../../lib/admin/auth/roleGuard";
import { sendToGemini } from "../../../../../lib/admin/ai/gemini";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

/**
 * Generates Gemini analytics insights from attendance records.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = (await request.json()) as Record<string, unknown>;

    if (!Array.isArray(body.attendanceData)) {
      return NextResponse.json({ error: "attendanceData must be an array" }, { status: 400 });
    }

    const analytics = await sendToGemini(body.attendanceData as Array<Record<string, unknown>>);

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}