import { MongoClient, type Db } from 'mongodb';

let connectPromise: Promise<Db> | null = null;

export async function getUserDb(): Promise<Db> {
  if (!connectPromise) {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri || !dbName) {
      throw new Error('Missing MONGODB_URI or MONGODB_DB_NAME in environment variables.');
    }

    connectPromise = MongoClient.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    }).then((client) => client.db(dbName));
  }

  return connectPromise;
}
