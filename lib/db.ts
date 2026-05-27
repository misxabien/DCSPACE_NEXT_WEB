import { MongoClient, type Db } from "mongodb";

let cachedDb: Db | null = null;
let connectPromise: Promise<Db> | null = null;
let indexesPromise: Promise<void> | null = null;

function getConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error("Missing MONGODB_URI or MONGODB_DB_NAME in environment variables.");
  }

  return { uri, dbName };
}

async function ensureIndexes(db: Db) {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const users = db.collection("users");
      const bookmarks = db.collection("bookmarks");

      await users.updateMany({ rfidNumber: "" }, { $unset: { rfidNumber: "" } });
      const existing = await users.indexes();
      const rfidIndex = existing.find((index) => index.name === "rfidNumber_1");
      const hasCompatibleRfidIndex = Boolean(rfidIndex?.unique) && Boolean(rfidIndex?.sparse);

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

function buildNonSrvFallbackUri(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) {
    return null;
  }

  try {
    const parsed = new URL(uri);
    const auth = parsed.username
      ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
      : "";
    const dbPath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
    const params = new URLSearchParams(parsed.search);

    if (!params.has("tls")) {
      params.set("tls", "true");
    }

    const query = params.toString();
    return `mongodb://${auth}${parsed.host}${dbPath}${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}

async function connectWithFallback(uri: string, dbName: string) {
  const clientOptions = {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  };

  const tryConnect = async (candidateUri: string) => {
    const client = new MongoClient(candidateUri, clientOptions);
    await client.connect();
    return client;
  };

  try {
    const client = await tryConnect(uri);
    return client.db(dbName);
  } catch (primaryError) {
    const fallbackUri = buildNonSrvFallbackUri(uri);
    const message = primaryError instanceof Error ? primaryError.message : "";
    const isSrvLookupFailure =
      message.includes("querySrv") || message.includes("ENOTFOUND") || message.includes("ECONNREFUSED");

    if (!fallbackUri || !isSrvLookupFailure) {
      throw primaryError;
    }

    const fallbackClient = await tryConnect(fallbackUri);
    return fallbackClient.db(dbName);
  }
}

export async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!connectPromise) {
    const { uri, dbName } = getConfig();
    connectPromise = connectWithFallback(uri, dbName)
      .then(async (db) => {
        cachedDb = db;
        await ensureIndexes(db);
        return db;
      })
      .catch((error) => {
        connectPromise = null;
        cachedDb = null;
        throw error;
      });
  }

  return connectPromise;
}
