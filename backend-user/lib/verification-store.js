const PURPOSE = "registration";
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const globalStore = globalThis;
if (!globalStore.__dcEmailVerifications) {
  globalStore.__dcEmailVerifications = new Map();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function shouldUseMemoryVerificationStore() {
  return process.env.VERIFICATION_USE_MEMORY === "true";
}

export function saveMemoryVerification({ email, codeHash, expiresAt }) {
  const normalizedEmail = normalizeEmail(email);
  globalStore.__dcEmailVerifications.set(`${PURPOSE}:${normalizedEmail}`, {
    email: normalizedEmail,
    purpose: PURPOSE,
    codeHash,
    expiresAt,
    attempts: 0,
    updatedAt: new Date(),
  });
}

export function readMemoryVerification(email) {
  return globalStore.__dcEmailVerifications.get(`${PURPOSE}:${normalizeEmail(email)}`) || null;
}

export function deleteMemoryVerification(email) {
  globalStore.__dcEmailVerifications.delete(`${PURPOSE}:${normalizeEmail(email)}`);
}

export function incrementMemoryAttempts(record) {
  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts >= MAX_ATTEMPTS) {
    deleteMemoryVerification(record.email);
  }
}

export function isMemoryVerificationExpired(record) {
  return record.expiresAt && new Date(record.expiresAt).getTime() < Date.now();
}

export { CODE_TTL_MS, MAX_ATTEMPTS, PURPOSE };
