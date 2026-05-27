import { connectUserMongo } from "./mongo-connect.js";

let cachedDb = null;
let connectPromise = null;
let indexesPromise = null;

async function ensureIndexes(db) {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const users = db.collection("users");
      const bookmarks = db.collection("bookmarks");
      await users.updateMany({ rfidNumber: "" }, { $unset: { rfidNumber: "" } });
      const existing = await users.indexes();
      const rfidIndex = existing.find((index) => index.name === "rfidNumber_1");
      const hasCompatibleRfidIndex =
        Boolean(rfidIndex?.unique) && Boolean(rfidIndex?.sparse);
      if (rfidIndex && !hasCompatibleRfidIndex) {
        await users.dropIndex("rfidNumber_1");
      }
      await Promise.all([
        users.createIndex({ email: 1 }, { unique: true }),
        users.createIndex({ studentNumber: 1 }, { unique: true }),
        users.createIndex({ rfidNumber: 1 }, { unique: true, sparse: true }),
        bookmarks.createIndex({ userId: 1, eventId: 1 }, { unique: true }),
      ]);
    })().catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }
  await indexesPromise;
}

export async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!connectPromise) {
    connectPromise = connectUserMongo()
      .then(async ({ db }) => {
        cachedDb = db;
        await ensureIndexes(cachedDb);
        return cachedDb;
      })
      .catch((error) => {
        connectPromise = null;
        cachedDb = null;
        throw error;
      });
  }

  return connectPromise;
}
