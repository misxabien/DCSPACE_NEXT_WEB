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
    ));
  }
}

function formatAttendanceTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const body = await request.json();
    const eventId = String(body.eventId || "").trim();
    const eventName = String(body.eventName || "").trim();
    const eventDate = String(body.eventDate || "").trim();
    const scannedRfid = String(body.rfidNumber || "").replace(/\s+/g, "").toLowerCase();
    const userRfid = String(authResult.user?.rfidNumber || "").replace(/\s+/g, "").toLowerCase();

    if (!eventId) {
      return withCors(NextResponse.json({ error: "eventId is required." }, { status: 400 }));
    }
    if (!scannedRfid) {
      return withCors(NextResponse.json({ error: "rfidNumber is required." }, { status: 400 }));
    }
    if (!userRfid || scannedRfid !== userRfid) {
      return withCors(NextResponse.json({ error: "RFID card does not match the signed-in account." }, { status: 400 }));
    }

    const db = await getDb();
    const userId = authResult.user._id.toString();
    const now = new Date();
    const currentTime = formatAttendanceTime(now);
    const attendanceLogs = db.collection("attendance_logs");
    const existingRecord = await attendanceLogs.findOne({ userId, eventId });
    const previousUpdatedAt = Date.parse(String(existingRecord?.updatedAt || ""));
    const isImmediateDuplicate =
      Number.isFinite(previousUpdatedAt) &&
      now.getTime() - previousUpdatedAt >= 0 &&
      now.getTime() - previousUpdatedAt < 1200;
    if (isImmediateDuplicate) {
      const duplicateTapType =
        existingRecord?.taps?.length && existingRecord.taps[existingRecord.taps.length - 1]?.tapOut
          ? "tap out"
          : "tap in";
      return withCors(NextResponse.json({
        message: "Duplicate RFID scan ignored.",
        tapType: duplicateTapType,
        currentTime,
        record: existingRecord,
      }, { status: 200 }));
    }
    const taps = Array.isArray(existingRecord?.taps)
      ? [...existingRecord.taps]
      : existingRecord?.tapIn || existingRecord?.tapOut
      ? [{ tapIn: existingRecord.tapIn || "", tapOut: existingRecord.tapOut || "" }]
      : [];

    const lastTapPair = taps[taps.length - 1];
    let tapType = "tap in";
    if (!lastTapPair || lastTapPair.tapOut) {
      taps.push({ tapIn: currentTime, tapOut: "" });
      tapType = "tap in";
    } else {
      lastTapPair.tapOut = currentTime;
      tapType = "tap out";
    }

    const activePair = taps[taps.length - 1] || {};
    const nextRecord = {
      userId,
      eventId,
      eventName: eventName || existingRecord?.eventName || "Event Name",
      eventDate: eventDate || existingRecord?.eventDate || "",
      studentNumber: String(authResult.user.studentNumber || ""),
      rfidNumber: String(authResult.user.rfidNumber || ""),
      taps,
      tapIn: activePair.tapIn || "",
      tapOut: activePair.tapOut || "",
      updatedAt: now.toISOString(),
      createdAt: existingRecord?.createdAt || now.toISOString(),
    };

    await attendanceLogs.updateOne(
      { userId, eventId },
      { $set: nextRecord },
      { upsert: true },
    );
  }
}
