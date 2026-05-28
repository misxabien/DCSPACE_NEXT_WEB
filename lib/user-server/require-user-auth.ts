import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getUserDb } from '@/lib/user-server/get-user-db';

type AuthSuccess = {
  user: {
    _id: ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
    photoUrl?: string;
    role?: string;
    rfidNumber?: string;
    organizationPart?: string;
    organizationRole?: string;
    course?: string;
    school?: string;
  };
};

type AuthFailure = {
  error: string;
  status: number;
};

export async function requireUserAuth(request: Request): Promise<AuthSuccess | AuthFailure> {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return { error: 'Missing bearer token.', status: 401 };
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return { error: 'Server auth is not configured.', status: 500 };
  }

  try {
    const payload = jwt.verify(token, secret) as { sub?: string };
    const userId = typeof payload?.sub === 'string' ? payload.sub : '';

    if (!ObjectId.isValid(userId)) {
      return { error: 'Invalid auth token.', status: 401 };
    }

    const db = await getUserDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return { error: 'User not found.', status: 404 };
    }

    return { user: user as AuthSuccess['user'] };
  } catch {
    return { error: 'Invalid or expired auth token.', status: 401 };
  }
}
