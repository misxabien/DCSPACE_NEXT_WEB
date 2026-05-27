import { getDb } from "@/lib/db";

let cachedAvailability = null;
let probePromise = null;

/**
 * Returns whether MongoDB is reachable. Result is cached for the process lifetime.
 */
export async function isDatabaseAvailable() {
  if (cachedAvailability !== null) {
    return cachedAvailability;
  }
  if (!probePromise) {
    probePromise = getDb()
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        probePromise = null;
      });
  }
  cachedAvailability = await probePromise;
  return cachedAvailability;
}

export function resetDatabaseAvailabilityCache() {
  cachedAvailability = null;
}
