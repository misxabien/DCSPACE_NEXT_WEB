import { NextResponse } from 'next/server';
import type { Db } from 'mongodb';
import { isSchoolEmail } from '@/lib/user-server/auth-helpers';
import { withCors, optionsResponse } from '@/lib/user-server/cors';
import { getUserDb } from '@/lib/user-server/get-user-db';
import { issueRegistrationVerificationCode } from '@/lib/user-server/verification';

export const maxDuration = 60;

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return withCors(NextResponse.json({ error: 'email is required.' }, { status: 400 }));
    }

    if (!isSchoolEmail(email)) {
      return withCors(
        NextResponse.json({ error: 'email must use your school domain (@sdca.edu.ph).' }, { status: 400 }),
      );
    }

    let db: Db | null = null;
    try {
      db = await getUserDb();
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return withCors(
          NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 }),
        );
      }
    } catch {
      db = null;
    }

    const result = await issueRegistrationVerificationCode(email, { db });

    return withCors(
      NextResponse.json(
        {
          message: result.devMode
            ? 'Verification code generated. Check the terminal where npm run dev is running (SMTP not configured).'
            : 'Verification code sent. Please check your school email inbox (and spam folder).',
          email: result.email,
          expiresAt: result.expiresAt,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isEmailConfig = /email is not set up|mail server|smtp|email server timed out|could not reach the email server/i.test(
      message,
    );
    const isDatabase = /mongo|Missing MONGODB/i.test(message);

    if (isEmailConfig) {
      return withCors(NextResponse.json({ error: message, details: message }, { status: 503 }));
    }
    if (isDatabase) {
      return withCors(
        NextResponse.json(
          {
            error: 'Could not connect to the database. Check MONGODB_URI in .env.local.',
            details: message,
          },
          { status: 500 },
        ),
      );
    }

    return withCors(
      NextResponse.json({ error: 'Failed to send verification email.', details: message }, { status: 500 }),
    );
  }
}
