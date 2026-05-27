import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { toEventResponse } from "@/lib/event-helpers";
import { requireAuth } from "@/lib/route-auth";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
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

export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ error: "Invalid event id." }, { status: 400 }));
    }

    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return withCors(NextResponse.json({ error: "Event not found." }, { status: 404 }));
    }

    const userEmail = String(authResult.user.email || "").trim().toLowerCase();
    const submitterEmail = String(event.submittedByEmail || "").trim().toLowerCase();
    const role = String(authResult.user.organizationRole || "").toLowerCase();
    const isOfficer = role.includes("officer");

    if (submitterEmail && submitterEmail !== userEmail && !isOfficer) {
      return withCors(NextResponse.json({ error: "You can only delete events you submitted." }, { status: 403 }));
    }

    await Promise.all([
      db.collection("events").deleteOne({ _id: new ObjectId(id) }),
      db.collection("bookmarks").deleteMany({ eventId: id }),
      db.collection("event_registrations").deleteMany({ eventId: id }),
      db.collection("attendance_logs").deleteMany({ eventId: id }),
    ]);

    return withCors(NextResponse.json({ message: "Event deleted successfully." }, { status: 200 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        { error: "Failed to delete event.", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      ),
    );
  }
}
