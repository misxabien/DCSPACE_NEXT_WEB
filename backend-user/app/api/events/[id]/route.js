import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { toEventResponse } from "@/lib/event-helpers";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ error: "Invalid event id." }, { status: 400 }));
    }
    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return withCors(NextResponse.json({ error: "Event not found." }, { status: 404 }));
    }
    return withCors(NextResponse.json({ event: toEventResponse(event) }, { status: 200 }));
  } catch (error) {
    return withCors(NextResponse.json(
      { error: "Failed to fetch event details.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    ));
  }
}
