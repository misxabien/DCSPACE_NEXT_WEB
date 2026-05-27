import type { Db } from 'mongodb';
import { connectUserMongo } from '@/lib/user-server/mongo-connect';

let connectPromise: Promise<Db> | null = null;

export async function getUserDb(): Promise<Db> {
  if (!connectPromise) {
    connectPromise = connectUserMongo()
      .then(({ db }) => db)
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  return connectPromise;
}
