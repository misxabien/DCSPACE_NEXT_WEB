import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sanitizeUser } from "@/lib/auth-helpers";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatAttendanceTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const rfidNumber = String(body.rfidNumber || "").trim();
    const eventId = String(body.eventId || "").trim();
    const eventName = String(body.eventName || "").trim();
    const eventDate = String(body.eventDate || "").trim();

    if (!rfidNumber) {
      return withCors(NextResponse.json({ error: "rfidNumber is required." }, { status: 400 }));
    }
    if (!eventId) {
      return withCors(NextResponse.json({ error: "eventId is required." }, { status: 400 }));
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({
      rfidNumber: { $regex: `^${escapeRegex(rfidNumber)}$`, $options: "i" },
    });
    if (!user) {
      return withCors(NextResponse.json({ error: "RFID tag not found." }, { status: 404 }));
    }

    const userId = user._id.toString();
    const sanitizedUser = sanitizeUser(user);
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
      return withCors(
        NextResponse.json(
          {
            message: "Duplicate RFID scan ignored.",
            tapType: duplicateTapType,
            currentTime,
            record: existingRecord,
            user: sanitizedUser,
          },
          { status: 200 },
        ),
      );
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
      eventName: eventName || existingRecord?.eventName || "RFID Scan Event",
      eventDate: eventDate || existingRecord?.eventDate || now.toISOString().slice(0, 10),
      firstName: String(user.firstName || ""),
      lastName: String(user.lastName || ""),
      fullName: String(sanitizedUser.fullName || "").trim(),
      email: String(user.email || ""),
      course: String(user.course || ""),
      school: String(user.school || ""),
      organizationPart: String(user.organizationPart || ""),
      organizationRole: String(user.organizationRole || ""),
      studentNumber: String(user.studentNumber || ""),
      rfidNumber: String(user.rfidNumber || ""),
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

    // Keep an append-only history row for each card scan.
    await db.collection("attendance_tap_history").insertOne({
      userId,
      eventId,
      eventName: nextRecord.eventName,
      eventDate: nextRecord.eventDate,
      tapType,
      time: currentTime,
      tapIn: activePair.tapIn || "",
      tapOut: activePair.tapOut || "",
      tappedAt: now.toISOString(),
      firstName: nextRecord.firstName,
      lastName: nextRecord.lastName,
      fullName: nextRecord.fullName,
      email: nextRecord.email,
      course: nextRecord.course,
      school: nextRecord.school,
      organizationPart: nextRecord.organizationPart,
      organizationRole: nextRecord.organizationRole,
      studentNumber: nextRecord.studentNumber,
      rfidNumber: nextRecord.rfidNumber,
    });

    return withCors(
      NextResponse.json(
        {
          message: `${nextRecord.eventName} ${tapType} recorded at ${currentTime}.`,
          tapType,
          currentTime,
          record: nextRecord,
          user: sanitizedUser,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { error: "Failed to record RFID tap.", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      ),
    );
  }
}
