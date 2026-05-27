import { MongoClient, type Db } from 'mongodb';

const clientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 20000,
  // Prefer IPv4 — avoids TLS/DNS issues on some networks with Atlas.
  family: 4 as const,
};

export function getMongoConfig() {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim();

  if (!uri || !dbName) {
    throw new Error('Missing MONGODB_URI or MONGODB_DB_NAME in environment variables.');
  }

  return { uri, dbName };
}

function buildNonSrvFallbackUri(uri: string): string | null {
  if (!uri.startsWith('mongodb+srv://')) {
    return null;
  }

  try {
    const parsed = new URL(uri);
    const auth = parsed.username
      ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
      : '';
    const dbPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
    const params = new URLSearchParams(parsed.search);
    if (!params.has('tls')) {
      params.set('tls', 'true');
    }
    const query = params.toString();
    return `mongodb://${auth}${parsed.host}${dbPath}${query ? `?${query}` : ''}`;
  } catch {
    return null;
  }
}

function shouldTryFallback(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  return (
    message.includes('querySrv') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    /ssl|tls|alert internal error/i.test(message)
  );
}

async function tryConnect(uri: string) {
  const client = new MongoClient(uri, clientOptions);
  await client.connect();
  return client;
}

export async function connectUserMongo(): Promise<{ db: Db; client: MongoClient }> {
  const { uri, dbName } = getMongoConfig();

  try {
    const client = await tryConnect(uri);
    return { client, db: client.db(dbName) };
  } catch (primaryError) {
    const fallbackUri = buildNonSrvFallbackUri(uri);

    if (!fallbackUri || !shouldTryFallback(primaryError)) {
      throw primaryError;
    }

    const client = await tryConnect(fallbackUri);
    return { client, db: client.db(dbName) };
  }
}

export async function pingUserMongo(): Promise<{
  ok: boolean;
  dbName: string;
  collections: string[];
  error?: string;
}> {
  try {
    const { db } = await connectUserMongo();
    const collections = await db.listCollections().toArray();
    return {
      ok: true,
      dbName: db.databaseName,
      collections: collections.map((c) => c.name).sort(),
    };
  } catch (error) {
    return {
      ok: false,
      dbName: process.env.MONGODB_DB_NAME || '',
      collections: [],
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}
