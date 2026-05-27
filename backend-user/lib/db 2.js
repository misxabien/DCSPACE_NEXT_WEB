import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error("Missing MONGODB_URI or MONGODB_DB_NAME in environment variables.");
  }

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(dbName);

  await cachedDb.collection("users").createIndex({ email: 1 }, { unique: true });
  await cachedDb.collection("users").createIndex({ studentNumber: 1 }, { unique: true });
  await cachedDb.collection("bookmarks").createIndex({ userId: 1, eventId: 1 }, { unique: true });
  await cachedDb.collection("bookmarks").createIndex({ userId: 1, eventId: 1 }, { unique: true });

  return cachedDb;
}
