import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sanitizeUser, validateRegistrationBody } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { signAuthToken } from "@/lib/token";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validationError = validateRegistrationBody(body);
    if (validationError) {
      return withCors(NextResponse.json({ error: validationError }, { status: 400 }));
    }

    const rfidNumber = String(body.rfidNumber || "").trim();
    const newUser = {
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      studentNumber: String(body.studentNumber).trim(),
      email: String(body.email).trim().toLowerCase(),
      ...(rfidNumber ? { rfidNumber } : {}),
      organizationPart: String(body.organizationPart || "").trim(),
      organizationRole: String(body.organizationRole || "").trim(),
      course: String(body.course || "").trim(),
      school: String(body.school || "").trim(),
      passwordHash: hashPassword(String(body.password)),
      role: body.role === "faculty" ? "faculty" : "student",
      dataPrivacyAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const db = await getDb();
    const users = db.collection("users");
    const existingFilters = [{ email: newUser.email }, { studentNumber: newUser.studentNumber }];
    if (newUser.rfidNumber) {
      existingFilters.push({ rfidNumber: newUser.rfidNumber });
    }
    const existingUser = await users.findOne({ $or: existingFilters });
    if (existingUser) {
      if (newUser.rfidNumber && existingUser.rfidNumber === newUser.rfidNumber) {
        return withCors(NextResponse.json({ error: "This RFID tag is already linked to another account." }, { status: 409 }));
      }
      return withCors(
        NextResponse.json({ error: "Account already exists with this email or student number." }, { status: 409 }),
      );
    }
    const insertResult = await users.insertOne(newUser);
    const savedUser = { ...newUser, _id: insertResult.insertedId };

    const token = signAuthToken({
      sub: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    });

    return withCors(
      NextResponse.json(
        { message: "Account created successfully.", token, user: sanitizeUser(savedUser) },
        { status: 201 },
      ),
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const key = String(error?.message || error?.duplicateKey || "");
      const isRfid = key.includes("rfidNumber");
      return withCors(
        NextResponse.json(
          { error: isRfid ? "This RFID tag is already linked to another account." : "Account already exists with this email or student number." },
          { status: 409 },
        ),
      );
    }
    return withCors(
      NextResponse.json(
        { error: "Failed to register account.", details },
        { status: 500 },
      ),
    );
  }
}
