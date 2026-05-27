import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sanitizeUser, validateRegistrationBody } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { signAuthToken } from "@/lib/token";
import { verifyRegistrationCode } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validateRegistrationBody(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const verification = await verifyRegistrationCode(body.email, body.verificationCode);
    if (!verification.ok) {
      return withCors(NextResponse.json({ error: verification.error }, { status: 400 }));
    }

    const rfidNumber = String(body.rfidNumber || "").trim();
    const photoUrl = String(body.photoUrl || "").trim();
    const newUser = {
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      studentNumber: String(body.studentNumber).trim(),
      email: String(body.email).trim().toLowerCase(),
      ...(photoUrl ? { photoUrl } : {}),
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
    const existingFilters: Array<Record<string, string>> = [
      { email: newUser.email },
      { studentNumber: newUser.studentNumber },
    ];

    if (newUser.rfidNumber) {
      existingFilters.push({ rfidNumber: newUser.rfidNumber });
    }

    const existingUser = await users.findOne({ $or: existingFilters });

    if (existingUser) {
      if (newUser.rfidNumber && existingUser.rfidNumber === newUser.rfidNumber) {
        return NextResponse.json({ error: "This RFID tag is already linked to another account." }, { status: 409 });
      }

      return NextResponse.json(
        { error: "Account already exists with this email or student number." },
        { status: 409 },
      );
    }

    const insertResult = await users.insertOne(newUser);
    const savedUser = { ...newUser, _id: insertResult.insertedId };
    const token = signAuthToken({
      sub: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    });

    return NextResponse.json(
      { message: "Account created successfully.", token, user: sanitizeUser(savedUser) },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const isRfid = message.includes("rfidNumber");

      return NextResponse.json(
        {
          error: isRfid
            ? "This RFID tag is already linked to another account."
            : "Account already exists with this email or student number.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to register account.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
