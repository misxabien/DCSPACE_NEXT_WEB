import crypto from 'crypto';

const saltLength = 16;
const keyLength = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(saltLength).toString('hex');
  const hash = crypto.scryptSync(password, salt, keyLength).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = String(stored || '').split(':');
  if (!salt || !originalHash) {
    return false;
  }
  try {
    const hash = crypto.scryptSync(password, salt, keyLength).toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const originalBuffer = Buffer.from(originalHash, 'hex');
    if (hashBuffer.length !== originalBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, originalBuffer);
  } catch {
    return false;
  }
}
