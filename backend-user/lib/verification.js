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

async function useMemoryStore() {
  if (shouldUseMemoryVerificationStore()) {
    return true;
  }
  return !(await isDatabaseAvailable());
}

async function issueRegistrationVerificationCodeInMemory(email) {
  const normalizedEmail = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = hashPassword(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  saveMemoryVerification({ email: normalizedEmail, codeHash, expiresAt });

  await sendVerificationEmail({ email: normalizedEmail, code });

  return {
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    delivered: true,
    storage: "memory",
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

  await sendVerificationEmail({ email: normalizedEmail, code });

  return {
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    delivered: true,
    storage: "database",
  };
}

/**
 * Verifies a registration code for an email. Deletes the record on success.
 */
export async function verifyRegistrationCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedCode = String(code || "").trim();

  if (!/^\d{6}$/.test(trimmedCode)) {
    return { ok: false, error: "Verification code must be a 6-digit number." };
  }

  if (await useMemoryStore()) {
    const record = readMemoryVerification(normalizedEmail);
    if (!record) {
      return { ok: false, error: "No verification code found. Please request a new code." };
    }
    if (isMemoryVerificationExpired(record)) {
      deleteMemoryVerification(normalizedEmail);
      return { ok: false, error: "Verification code has expired. Please request a new code." };
    }
    if ((record.attempts || 0) >= MAX_ATTEMPTS) {
      deleteMemoryVerification(normalizedEmail);
      return { ok: false, error: "Too many failed attempts. Please request a new code." };
    }
    if (!verifyPassword(trimmedCode, record.codeHash)) {
      incrementMemoryAttempts(record);
      return { ok: false, error: "Invalid verification code." };
    }
    deleteMemoryVerification(normalizedEmail);
    return { ok: true };
  }

  const verifications = await getVerificationsCollection();
  const record = await verifications.findOne({ email: normalizedEmail, purpose: PURPOSE });

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

  await verifications.deleteOne({ _id: record._id });
  return { ok: true };
}
