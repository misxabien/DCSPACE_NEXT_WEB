import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

function getMinutesFromTime(time?: string) {
  const match = String(time || "").match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function getAttendedMinutes(record: unknown) {
  const tapsValue = record && typeof record === "object" ? (record as { taps?: unknown }).taps : undefined;
  const taps = Array.isArray(tapsValue) ? (tapsValue as Array<{ tapIn?: string; tapOut?: string }>) : [];

  return taps.reduce((total, pair) => {
    const tapIn = getMinutesFromTime(pair.tapIn);
    const tapOut = getMinutesFromTime(pair.tapOut);

    if (tapIn === null || tapOut === null) {
      return total;
    }

    return total + Math.max(0, tapOut - tapIn);
  }, 0);
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request);

    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = await getDb();
    const records = await db.collection("attendance_logs").find({ userId: authResult.user._id.toString() }).toArray();
    const totalEvents = records.length;
    const attendedEvents = records.filter((row) => getAttendedMinutes(row) > 0).length;
    const attendanceRate = totalEvents === 0 ? 0 : Math.round((attendedEvents / totalEvents) * 100);

    return NextResponse.json({ totalEvents, attendedEvents, attendanceRate }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate attendance status.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
