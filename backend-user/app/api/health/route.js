import { NextResponse } from "next/server";
import { connectUserMongo } from "../../../lib/mongo-connect.js";

export async function GET() {
  try {
    const { db } = await connectUserMongo();
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: "ok",
      dbName: db.databaseName,
      collections: collections.map((c) => c.name).sort(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "MongoDB connection failed.",
        hint: "Check MONGODB_URI and MONGODB_DB_NAME in backend-user/.env",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
