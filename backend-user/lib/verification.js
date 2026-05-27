import crypto from "crypto";
import { getDb } from "@/lib/db";
import { isDatabaseAvailable } from "@/lib/db-availability";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/mailer";
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  PURPOSE,
  deleteMemoryVerification,
  incrementMemoryAttempts,
  isMemoryVerificationExpired,
  readMemoryVerification,
  saveMemoryVerification,
  shouldUseMemoryVerificationStore,
} from "@/lib/verification-store";

const PASSWORD_RESET_PURPOSE = "password_reset";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function getVerificationsCollection() {
  const db = await getDb();
  const collection = db.collection("email_verifications");
  await collection.createIndex({ email: 1, purpose: 1 }, { unique: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return collection;
}

function getMemoryVerificationKey(email, purpose) {
  return `${purpose}:${normalizeEmail(email)}`;
}

function readMemoryVerificationByPurpose(email, purpose) {
  return globalThis.__dcEmailVerifications?.get(getMemoryVerificationKey(email, purpose)) || null;
}

function saveMemoryVerificationByPurpose({ email, codeHash, expiresAt, purpose }) {
  const normalizedEmail = normalizeEmail(email);
  globalThis.__dcEmailVerifications.set(getMemoryVerificationKey(normalizedEmail, purpose), {
    email: normalizedEmail,
    purpose,
    codeHash,
    expiresAt,
    attempts: 0,
    updatedAt: new Date(),
  });
}

function deleteMemoryVerificationByPurpose(email, purpose) {
  globalThis.__dcEmailVerifications?.delete(getMemoryVerificationKey(email, purpose));
}

async function useMemoryStore() {
  if (!(await isDatabaseAvailable())) {
    return true;
  }
  return shouldUseMemoryVerificationStore() && process.env.FORCE_VERIFICATION_MEMORY === "true";
}

async function issueRegistrationVerificationCodeInMemory(email) {
  const normalizedEmail = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = hashPassword(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  saveMemoryVerification({ email: normalizedEmail, codeHash, expiresAt });

  const sendResult = await sendVerificationEmail({ email: normalizedEmail, code });

  return {
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    delivered: true,
    storage: "memory",
    devMode: sendResult.devMode,
    code: sendResult.devMode ? code : undefined,
  };
}

/**
 * Creates a verification code for the given school email and sends it by email.
 */
export async function issueRegistrationVerificationCode(email) {
  if (await useMemoryStore()) {
    return issueRegistrationVerificationCodeInMemory(email);
  }

  const normalizedEmail = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = hashPassword(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  const verifications = await getVerificationsCollection();
  await verifications.updateOne(
    { email: normalizedEmail, purpose: PURPOSE },
    {
      $set: {
        email: normalizedEmail,
        purpose: PURPOSE,
        codeHash,
        expiresAt,
        updatedAt: now,
        attempts: 0,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const sendResult = await sendVerificationEmail({ email: normalizedEmail, code });

  return {
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    delivered: true,
    storage: "database",
    devMode: sendResult.devMode,
    code: sendResult.devMode ? code : undefined,
  };
}

/**
 * Verifies a registration code for an email. Deletes the record on success.
 */
export async function verifyRegistrationCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedCode = String(code || "").trim().replace(/\s/g, "");

  if (!/^\d{6}$/.test(trimmedCode)) {
    return { ok: false, error: "Verification code must be a 6-digit number." };
  }

  if (await isDatabaseAvailable()) {
    const verifications = await getVerificationsCollection();
    const record = await verifications.findOne({ email: normalizedEmail, purpose: PURPOSE });
    if (record) {
      if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
        await verifications.deleteOne({ _id: record._id });
        return { ok: false, error: "Verification code has expired. Please request a new code." };
      }
      if ((record.attempts || 0) >= MAX_ATTEMPTS) {
        await verifications.deleteOne({ _id: record._id });
        return { ok: false, error: "Too many failed attempts. Please request a new code." };
      }
      if (!verifyPassword(trimmedCode, record.codeHash)) {
        await verifications.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
        return { ok: false, error: "Invalid verification code." };
      }
      await verifications.deleteOne({ _id: record._id });
      return { ok: true };
    }
  }

  const memoryRecord = readMemoryVerification(normalizedEmail);
  if (memoryRecord) {
    if (isMemoryVerificationExpired(memoryRecord)) {
      deleteMemoryVerification(normalizedEmail);
      return { ok: false, error: "Verification code has expired. Please request a new code." };
    }
    if ((memoryRecord.attempts || 0) >= MAX_ATTEMPTS) {
      deleteMemoryVerification(normalizedEmail);
      return { ok: false, error: "Too many failed attempts. Please request a new code." };
    }
    if (!verifyPassword(trimmedCode, memoryRecord.codeHash)) {
      incrementMemoryAttempts(memoryRecord);
      return { ok: false, error: "Invalid verification code." };
    }
    deleteMemoryVerification(normalizedEmail);
    return { ok: true };
  }

  return { ok: false, error: "No verification code found. Please request a new code." };
}

async function issueVerificationCodeForPurpose(email, purpose) {
  const normalizedEmail = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = hashPassword(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  if (await useMemoryStore()) {
    saveMemoryVerificationByPurpose({ email: normalizedEmail, codeHash, expiresAt, purpose });
    const sendResult = await sendVerificationEmail({ email: normalizedEmail, code });
    return {
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      delivered: true,
      storage: "memory",
      devMode: sendResult.devMode,
      code: sendResult.devMode ? code : undefined,
    };
  }

  const verifications = await getVerificationsCollection();
  await verifications.updateOne(
    { email: normalizedEmail, purpose },
    {
      $set: {
        email: normalizedEmail,
        purpose,
        codeHash,
        expiresAt,
        updatedAt: now,
        attempts: 0,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const sendResult = await sendVerificationEmail({ email: normalizedEmail, code });
  return {
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    delivered: true,
    storage: "database",
    devMode: sendResult.devMode,
    code: sendResult.devMode ? code : undefined,
  };
}

async function verifyCodeForPurpose(email, code, purpose, options = {}) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedCode = String(code || "").trim();
  const consume = options.consume === true;

  if (!/^\d{6}$/.test(trimmedCode)) {
    return { ok: false, error: "Verification code must be a 6-digit number." };
  }

  if (await useMemoryStore()) {
    const record = readMemoryVerificationByPurpose(normalizedEmail, purpose);
    if (!record) {
      return { ok: false, error: "No verification code found. Please request a new code." };
    }
    if (isMemoryVerificationExpired(record)) {
      deleteMemoryVerificationByPurpose(normalizedEmail, purpose);
      return { ok: false, error: "Verification code has expired. Please request a new code." };
    }
    if ((record.attempts || 0) >= MAX_ATTEMPTS) {
      deleteMemoryVerificationByPurpose(normalizedEmail, purpose);
      return { ok: false, error: "Too many failed attempts. Please request a new code." };
    }
    if (!verifyPassword(trimmedCode, record.codeHash)) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        deleteMemoryVerificationByPurpose(normalizedEmail, purpose);
      }
      return { ok: false, error: "Invalid verification code." };
    }

    if (consume) {
      deleteMemoryVerificationByPurpose(normalizedEmail, purpose);
    }

    return { ok: true };
  }

  const verifications = await getVerificationsCollection();
  const record = await verifications.findOne({ email: normalizedEmail, purpose });

  if (!record) {
    return { ok: false, error: "No verification code found. Please request a new code." };
  }
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    await verifications.deleteOne({ _id: record._id });
    return { ok: false, error: "Verification code has expired. Please request a new code." };
  }
  if ((record.attempts || 0) >= MAX_ATTEMPTS) {
    await verifications.deleteOne({ _id: record._id });
    return { ok: false, error: "Too many failed attempts. Please request a new code." };
  }

  const isValid = verifyPassword(trimmedCode, record.codeHash);
  if (!isValid) {
    await verifications.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return { ok: false, error: "Invalid verification code." };
  }

  if (consume) {
    await verifications.deleteOne({ _id: record._id });
  }

  return { ok: true };
}

export async function issuePasswordResetCode(email) {
  return issueVerificationCodeForPurpose(email, PASSWORD_RESET_PURPOSE);
}

export async function verifyPasswordResetCode(email, code, options = {}) {
  return verifyCodeForPurpose(email, code, PASSWORD_RESET_PURPOSE, options);
}
