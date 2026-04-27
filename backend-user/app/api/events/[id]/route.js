import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { toEventResponse } from "@/lib/event-helpers";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }
    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    return NextResponse.json({ event: toEventResponse(event) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch event details.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
