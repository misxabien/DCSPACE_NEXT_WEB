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
    const records = await db.collection("attendance_logs").find({ userId: authResult.user._id.toString() }).toArray();
    const totalEvents = records.length;
    const attendedEvents = records.filter((row) => Number(row.attendedMinutes || 0) > 0).length;
    const attendanceRate = totalEvents === 0 ? 0 : Math.round((attendedEvents / totalEvents) * 100);

    return NextResponse.json({ totalEvents, attendedEvents, attendanceRate }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate attendance status.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}