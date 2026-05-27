import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const authResult = await requireAuth(request);

    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { eventId } = await params;

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }

    const db = await getDb();
    const eventObjectId = new ObjectId(eventId);
    const event = await db.collection("events").findOne({ _id: eventObjectId });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const now = new Date();
    const userId = authResult.user._id.toString();

    await db.collection("event_registrations").updateOne(
      { userId, eventId },
      {
        $set: {
          userId,
          eventId,
          status: "Registered",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    await db.collection("events").updateOne(
      { _id: eventObjectId },
      {
        $addToSet: { participantIds: userId },
        $set: { updatedAt: now },
      },
    );

    return NextResponse.json({ message: "Registered.", eventId }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to register for event.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
