import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const saltLength = 16;
const keyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(saltLength).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: unknown) {
  const [salt, originalHash] = String(stored || "").split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const hash = scryptSync(password, salt, keyLength).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const originalHashBuffer = Buffer.from(originalHash, "hex");

  if (hashBuffer.length !== originalHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, originalHashBuffer);
}
