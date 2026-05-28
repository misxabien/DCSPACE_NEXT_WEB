import type { Db } from 'mongodb';
import { connectUserMongo } from '@/lib/user-server/mongo-connect';

let connectPromise: Promise<Db> | null = null;
const mongoConnectTimeoutMs = 9000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export async function getUserDb(): Promise<Db> {
  if (!connectPromise) {
    connectPromise = withTimeout(
      connectUserMongo(),
      mongoConnectTimeoutMs,
      'MongoDB connection timed out. Check MONGODB_URI, Atlas IP allowlist, and network access.',
    )
      .then(({ db }) => db)
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  return connectPromise;
}
