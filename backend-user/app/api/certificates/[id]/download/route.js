import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid certificate id." }, { status: 400 });
    }

    const db = await getDb();
    const certificate = await db.collection("certificates").findOne({
      _id: new ObjectId(id),
      userId: authResult.user._id.toString(),
    });
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: certificate._id.toString(),
        downloadUrl: certificate.downloadUrl || "",
        fileName: certificate.fileName || `${certificate.eventTitle || "certificate"}.pdf`,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate certificate download.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
