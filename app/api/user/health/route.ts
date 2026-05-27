import { NextResponse } from 'next/server';
import { pingUserMongo } from '@/lib/user-server/mongo-connect';

export async function GET() {
  const result = await pingUserMongo();

  if (!result.ok) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'MongoDB connection failed.',
        hint: 'Check MONGODB_URI and MONGODB_DB_NAME in .env.local, Atlas IP allowlist, and URL-encoded password.',
        error: result.error,
        dbName: result.dbName,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: 'ok',
    dbName: result.dbName,
    collections: result.collections,
  });
}
