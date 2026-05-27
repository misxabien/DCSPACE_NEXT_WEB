import crypto from "crypto";

const saltLength = 16;
const keyLength = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(saltLength).toString("hex");
  const hash = crypto.scryptSync(password, salt, keyLength).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, originalHash] = String(stored || "").split(":");
  if (!salt || !originalHash) {
    return false;
  }
  const hash = crypto.scryptSync(password, salt, keyLength).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}
