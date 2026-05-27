import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import {
  buildEventSnapshot,
  toRegistrationResponse,
  validateRegistrationBody,
} from "@/lib/registration-helpers";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const db = await getDb();
    const userId = authResult.user._id.toString();
    const { searchParams } = new URL(request.url);
    const eventId = String(searchParams.get("eventId") || "").trim();
    const query = {};

    if (eventId) {
      if (!ObjectId.isValid(eventId)) {
        return withCors(NextResponse.json({ error: "Invalid eventId." }, { status: 400 }));
      }

      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
      if (!event) {
        return withCors(NextResponse.json({ error: "Event not found." }, { status: 404 }));
      }

      const userEmail = String(authResult.user.email || "").trim().toLowerCase();
      const submitterEmail = String(event.submittedByEmail || "").trim().toLowerCase();
      const role = String(authResult.user.organizationRole || "").toLowerCase();
      const isOfficer = role.includes("officer");

      if (submitterEmail && submitterEmail !== userEmail && !isOfficer) {
        return withCors(NextResponse.json({ error: "You can only review registrations for your own events." }, { status: 403 }));
      }

      query.eventId = eventId;
    } else {
      query.userId = userId;
    }

    const rows = await db.collection("event_registrations").find(query).sort({ createdAt: -1 }).toArray();

    return withCors(
      NextResponse.json({ registrations: rows.map(toRegistrationResponse) }, { status: 200 }),
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Failed to fetch registrations.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const body = await request.json();
    const validationError = validateRegistrationBody(body);
    if (validationError) {
      return withCors(NextResponse.json({ error: validationError }, { status: 400 }));
    }

    const eventId = String(body.eventId).trim();
    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return withCors(NextResponse.json({ error: "Event not found." }, { status: 404 }));
    }

    const userId = authResult.user._id.toString();
    const existing = await db.collection("event_registrations").findOne({ userId, eventId });
    const requirementFiles = Array.isArray(body.requirementFiles)
      ? body.requirementFiles.map((file) => ({
          requirementName: String(file?.requirementName || "").trim(),
          name: String(file?.name || "").trim(),
          type: String(file?.type || "").trim(),
          size: Number(file?.size) || 0,
        }))
      : [];

    if (existing) {
      const updates = {
        eventSnapshot: buildEventSnapshot(event),
        updatedAt: new Date().toISOString(),
      };
      if (requirementFiles.length > 0) {
        updates.requirementFiles = requirementFiles;
      }

      await db.collection("event_registrations").updateOne({ _id: existing._id }, { $set: updates });
      const saved = await db.collection("event_registrations").findOne({ _id: existing._id });
      return withCors(
        NextResponse.json(
          { message: "Registration updated.", registration: toRegistrationResponse(saved) },
          { status: 200 },
        ),
      );
    }

    const registration = {
      userId,
      eventId,
      eventSnapshot: buildEventSnapshot(event),
      userSnapshot: {
        id: userId,
        firstName: String(authResult.user.firstName || "").trim(),
        lastName: String(authResult.user.lastName || "").trim(),
        email: String(authResult.user.email || "").trim().toLowerCase(),
        course: String(authResult.user.course || "").trim(),
        organization: String(authResult.user.organizationPart || "").trim(),
      },
      requirementFiles,
      status: "Registered",
      certificate: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("event_registrations").insertOne(registration);
    const saved = { ...registration, _id: result.insertedId };

    return withCors(
      NextResponse.json(
        { message: "Registered for event.", registration: toRegistrationResponse(saved) },
        { status: 201 },
      ),
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Failed to register for event.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}
