import jwt, { type SignOptions } from 'jsonwebtoken';

export function signAuthToken(payload: { sub: string; email: string; role: string }) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  if (!secret) {
    throw new Error('Missing JWT_SECRET in environment variables.');
  }
  return jwt.sign(payload, secret, { expiresIn });
}
