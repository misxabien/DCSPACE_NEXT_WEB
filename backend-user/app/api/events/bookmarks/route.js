import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { toEventResponse } from "@/lib/event-helpers";
import { requireAuth } from "@/lib/route-auth";

export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = await getDb();
    const rows = await db.collection("bookmarks").find({ userId: authResult.user._id.toString() }).toArray();
    const eventIds = rows
      .map((row) => row.eventId)
      .filter((eventId) => typeof eventId === "string" && ObjectId.isValid(eventId))
      .map((eventId) => new ObjectId(eventId));

    if (eventIds.length === 0) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    const events = await db.collection("events").find({ _id: { $in: eventIds } }).toArray();
    return NextResponse.json({ events: events.map(toEventResponse) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookmarked events.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}