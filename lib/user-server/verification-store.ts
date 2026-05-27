const PURPOSE = 'registration';
export const CODE_TTL_MS = 15 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

type MemoryRecord = {
  email: string;
  purpose: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & {
  __dcEmailVerifications?: Map<string, MemoryRecord>;
};

if (!globalStore.__dcEmailVerifications) {
  globalStore.__dcEmailVerifications = new Map();
}

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export function shouldUseMemoryVerificationStore() {
  return process.env.VERIFICATION_USE_MEMORY === 'true';
}

export function saveMemoryVerification({
  email,
  codeHash,
  expiresAt,
}: {
  email: string;
  codeHash: string;
  expiresAt: Date;
}) {
  const normalizedEmail = normalizeEmail(email);
  globalStore.__dcEmailVerifications!.set(`${PURPOSE}:${normalizedEmail}`, {
    email: normalizedEmail,
    purpose: PURPOSE,
    codeHash,
    expiresAt,
    attempts: 0,
    updatedAt: new Date(),
  });
}

export function readMemoryVerification(email: string) {
  return globalStore.__dcEmailVerifications!.get(`${PURPOSE}:${normalizeEmail(email)}`) || null;
}

export function deleteMemoryVerification(email: string) {
  globalStore.__dcEmailVerifications!.delete(`${PURPOSE}:${normalizeEmail(email)}`);
}

export function incrementMemoryAttempts(record: MemoryRecord) {
  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts >= MAX_ATTEMPTS) {
    deleteMemoryVerification(record.email);
  }
}

export function isMemoryVerificationExpired(record: MemoryRecord) {
  return record.expiresAt && new Date(record.expiresAt).getTime() < Date.now();
}

export { PURPOSE };
