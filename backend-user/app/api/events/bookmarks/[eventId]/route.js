import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function POST(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { eventId } = await params;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }

    const db = await getDb();
    const userId = authResult.user._id.toString();
    await db.collection("bookmarks").updateOne(
      { userId, eventId },
      { $set: { userId, eventId, createdAt: new Date().toISOString() } },
      { upsert: true },
    );

    return NextResponse.json({ message: "Bookmarked." }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to bookmark event.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { eventId } = await params;
    const db = await getDb();
    await db.collection("bookmarks").deleteOne({ userId: authResult.user._id.toString(), eventId });

    return NextResponse.json({ message: "Bookmark removed." }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove bookmark.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}