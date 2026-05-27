/**
 * Seeds or updates the development admin account in MongoDB.
 * Usage: node scripts/seed-admin.mjs
 */
import { randomBytes, scryptSync } from "crypto";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";
const email = (process.env.DEV_ADMIN_EMAIL ?? "admin@sdca.edu.ph").trim().toLowerCase();
const password = process.env.DEV_ADMIN_PASSWORD ?? "Admin@123";
const name = process.env.DEV_ADMIN_NAME ?? "DC Space Admin";

function hashPassword(passwordValue, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(passwordValue, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const client = new MongoClient(mongoUri);

try {
  await client.connect();
  const users = client.db(mongoDbName).collection("users");
  const now = new Date();
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          passwordHash: hashPassword(password),
          role: "admin",
          isActive: true,
          updatedAt: now,
        },
      },
    );
    console.log(`Updated admin: ${email}`);
  } else {
    await users.insertOne({
      name,
      email,
      passwordHash: hashPassword(password),
      role: "admin",
      organizationName: null,
      studentId: null,
      rfid: null,
      registrationStatus: "Not Registered",
      isActive: true,
      authProviders: ["credentials"],
      googleId: null,
      assignedEventIds: [],
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created admin: ${email}`);
  }

  console.log(`Password: ${password}`);
} catch (error) {
  console.error("Seed failed. Is MongoDB running?", error);
  process.exit(1);
} finally {
  await client.close();
}
