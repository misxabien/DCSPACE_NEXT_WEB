import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { validateRegistrationBody } from '@/lib/user-server/auth-helpers';
import { withCors, optionsResponse } from '@/lib/user-server/cors';
import { getUserDb } from '@/lib/user-server/get-user-db';
import { hashPassword } from '@/lib/user-server/password';
import { sanitizeUser } from '@/lib/user-server/sanitize-user';
import { signAuthToken } from '@/lib/user-server/token';
import { verifyRegistrationCode } from '@/lib/user-server/verification';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validateRegistrationBody(body);
    if (validationError) {
      return withCors(NextResponse.json({ error: validationError }, { status: 400 }));
    }

    const verification = await verifyRegistrationCode(String(body.email), String(body.verificationCode));
    if (!verification.ok) {
      return withCors(NextResponse.json({ error: verification.error }, { status: 400 }));
    }

    const rfidNumber = String(body.rfidNumber || '').trim();
    const photoUrl = String(body.photoUrl || '').trim();
    const newUser = {
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      studentNumber: String(body.studentNumber).trim(),
      email: String(body.email).trim().toLowerCase(),
      ...(photoUrl ? { photoUrl } : {}),
      ...(rfidNumber ? { rfidNumber } : {}),
      organizationPart: String(body.organizationPart || '').trim(),
      organizationRole: String(body.organizationRole || '').trim(),
      course: String(body.course || '').trim(),
      school: String(body.school || '').trim(),
      passwordHash: hashPassword(String(body.password)),
      role: body.role === 'faculty' ? 'faculty' : 'student',
      dataPrivacyAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const db = await getUserDb();
    const users = db.collection('users');
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
        return withCors(
          NextResponse.json({ error: 'This RFID tag is already linked to another account.' }, { status: 409 }),
        );
      }
      return withCors(
        NextResponse.json({ error: 'Account already exists with this email or student number.' }, { status: 409 }),
      );
    }

    const insertResult = await users.insertOne(newUser);
    const savedUser = { ...newUser, _id: insertResult.insertedId as ObjectId };
    const token = signAuthToken({
      sub: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    });

    return withCors(
      NextResponse.json(
        { message: 'Account created successfully.', token, user: sanitizeUser(savedUser) },
        { status: 201 },
      ),
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    return withCors(NextResponse.json({ error: 'Failed to register account.', details }, { status: 500 }));
  }
}
