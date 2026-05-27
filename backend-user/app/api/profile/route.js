import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { sanitizeUser } from "@/lib/auth-helpers";
import { requireAuth } from "@/lib/route-auth";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

function pickString(value) {
  return typeof value === "string" ? value.trim() : undefined;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request) {
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
  }
  return withCors(NextResponse.json({ profile: sanitizeUser(authResult.user) }, { status: 200 }));
}

export async function PATCH(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const body = await request.json();
    const updates = {};

    const firstName = pickString(body?.firstName);
    const lastName = pickString(body?.lastName);
    const photoUrl = pickString(body?.photoUrl);
    if (photoUrl !== undefined && photoUrl.length > 500_000) {
      return withCors(
        NextResponse.json({ error: "Profile photo is too large. Please use a smaller image." }, { status: 400 }),
      );
    }
    const course = pickString(body?.course);
    const school = pickString(body?.school);
    const organizationPart = pickString(body?.organizationPart);
    const organizationRole = pickString(body?.organizationRole);
    const rfidNumber = pickString(body?.rfidNumber);

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (course !== undefined) updates.course = course;
    if (school !== undefined) updates.school = school;
    if (organizationPart !== undefined) updates.organizationPart = organizationPart;
    if (organizationRole !== undefined) updates.organizationRole = organizationRole;
    if (rfidNumber !== undefined) updates.rfidNumber = rfidNumber;

    if (!Object.keys(updates).length) {
      return withCors(NextResponse.json({ error: "No profile fields to update." }, { status: 400 }));
    }

    updates.updatedAt = new Date().toISOString();

    const db = await getDb();
    await db.collection("users").updateOne({ _id: new ObjectId(authResult.user._id) }, { $set: updates });
    const savedUser = await db.collection("users").findOne({ _id: new ObjectId(authResult.user._id) });

    return withCors(NextResponse.json({ profile: sanitizeUser(savedUser), message: "Profile updated." }, { status: 200 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        { error: "Failed to update profile.", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      ),
    );
  }
}
