import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { toEventResponse, validateCreateEventBody } from "@/lib/event-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validateCreateEventBody(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const newEvent = {
      title: String(body.eventName).trim(),
      date: String(body.date || "").trim(),
      venue: String(body.venue || "").trim(),
      description: String(body.description || "").trim(),
      requester: String(body.requester || "").trim(),
      department: String(body.department || "").trim(),
      school: String(body.school || "").trim(),
      courseCode: String(body.courseCode || "").trim(),
      courseOrganizer: String(body.courseOrganizer || "").trim(),
      submittedByEmail: String(body.submittedByEmail || "").trim().toLowerCase(),
      startTime: String(body.startTime || "").trim(),
      endTime: String(body.endTime || "").trim(),
      duration: String(body.duration || "").trim(),
      minAttendance: String(body.minAttendance || "").trim(),
      posterImage: String(body.posterImage || "").trim(),
      status: "pending",
      certificate: "Processing",
      createdAt: new Date().toISOString(),
    };
    const db = await getDb();
    const result = await db.collection("events").insertOne(newEvent);

    return NextResponse.json(
      { message: "Event created successfully.", event: toEventResponse({ ...newEvent, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim();
    const department = String(searchParams.get("department") || "").trim();
    const submittedByEmail = String(searchParams.get("submittedByEmail") || "").trim().toLowerCase();
    const statusParam = String(searchParams.get("status") || "approved").trim().toLowerCase();
    const query: Record<string, unknown> = {};

    if (statusParam !== "all") {
      query.status = statusParam;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
        { requester: { $regex: search, $options: "i" } },
      ];
    }

    if (department) {
      query.department = { $regex: `^${department}$`, $options: "i" };
    }

    if (submittedByEmail) {
      query.submittedByEmail = submittedByEmail;
    }

    const db = await getDb();
    const rows = await db.collection("events").find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ events: rows.map(toEventResponse) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
