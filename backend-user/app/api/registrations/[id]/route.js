import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { toRegistrationResponse } from "@/lib/registration-helpers";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ error: "Invalid registration id." }, { status: 400 }));
    }

    const body = await request.json();
    const nextDecision = String(body?.decision || "").trim().toLowerCase();
    const decisionMap = {
      accepted: "Accepted",
      rejected: "Rejected",
      registered: "Registered",
    };
    const status = decisionMap[nextDecision];
    if (!status) {
      return withCors(NextResponse.json({ error: "Decision must be accepted, rejected, or registered." }, { status: 400 }));
    }

    const db = await getDb();
    const registration = await db.collection("event_registrations").findOne({ _id: new ObjectId(id) });
    if (!registration) {
      return withCors(NextResponse.json({ error: "Registration not found." }, { status: 404 }));
    }

    const event = await db.collection("events").findOne({ _id: new ObjectId(registration.eventId) });
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

    await db.collection("event_registrations").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
          reviewedBy: {
            id: authResult.user._id.toString(),
            email: userEmail,
            firstName: String(authResult.user.firstName || "").trim(),
            lastName: String(authResult.user.lastName || "").trim(),
          },
        },
      },
    );

    const saved = await db.collection("event_registrations").findOne({ _id: new ObjectId(id) });
    return withCors(
      NextResponse.json({ message: "Registration decision saved.", registration: toRegistrationResponse(saved) }, { status: 200 }),
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { error: "Failed to update registration decision.", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      ),
    );
  }
}
