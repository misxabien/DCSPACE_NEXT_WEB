import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = await getDb();
    const attendance = await db
      .collection("attendance_logs")
      .find({ userId: authResult.user._id.toString() })
      .sort({ eventDate: -1 })
      .toArray();

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attendance logs.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
