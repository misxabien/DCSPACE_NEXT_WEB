import {
  MongoClient,
  type Collection,
  type Db,
  type Document,
} from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";

const globalForMongo = globalThis as unknown as {
  adminSharedMongoClient?: MongoClient;
  adminSharedMongoClientPromise?: Promise<MongoClient>;
};

const mongoClientOptions = {
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 5000,
  family: 4 as const,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
};

function createDatabaseConnectionError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Failed to connect to MongoDB";
  const wrappedError = new Error(message) as Error & { status: number };
  wrappedError.name = "DatabaseConnectionError";
  wrappedError.status = 500;
  return wrappedError;
}

/**
 * Returns the shared MongoDB client instance for the admin backend.
 */
export async function getAdminMongoClient() {
  if (globalForMongo.adminSharedMongoClient) {
    return globalForMongo.adminSharedMongoClient;
  }

  if (!globalForMongo.adminSharedMongoClientPromise) {
    const client = new MongoClient(mongoUri, mongoClientOptions);
    globalForMongo.adminSharedMongoClientPromise = client.connect().catch((error: unknown) => {
      globalForMongo.adminSharedMongoClient = undefined;
      globalForMongo.adminSharedMongoClientPromise = undefined;
      throw createDatabaseConnectionError(error);
    });
  }

  globalForMongo.adminSharedMongoClient =
    await globalForMongo.adminSharedMongoClientPromise;
  return globalForMongo.adminSharedMongoClient;
}

/**
 * Returns the shared MongoDB database instance for the admin backend.
 */
export async function getAdminDatabase(): Promise<Db> {
  const client = await getAdminMongoClient();
  return client.db(mongoDbName);
}

/**
 * Returns a shared MongoDB collection instance for the admin backend.
 */
export async function getAdminCollection<TSchema extends Document = Document>(
  name: string,
): Promise<Collection<TSchema>> {
  const db = await getAdminDatabase();
  return db.collection<TSchema>(name);
}
