import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";

const globalForMongo = globalThis as unknown as {
  adminNotificationsMongoClient?: MongoClient;
  adminNotificationsMongoPromise?: Promise<MongoClient>;
};

async function getMongoClient() {
  if (globalForMongo.adminNotificationsMongoClient) {
    return globalForMongo.adminNotificationsMongoClient;
  }

  if (!globalForMongo.adminNotificationsMongoPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo.adminNotificationsMongoPromise = client.connect();
  }

  globalForMongo.adminNotificationsMongoClient = await globalForMongo.adminNotificationsMongoPromise;
  return globalForMongo.adminNotificationsMongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}

/**
 * Returns the merged event and report notification feed for the admin panel.
 */
export async function getNotifications() {
  const db = await getDatabase();
  const events = db.collection<any>("events");
  const reports = db.collection<any>("reports");

  const [eventItems, reportItems] = await Promise.all([
    events
      .find({ status: { $in: ["pending", "pending_approval", "PENDING", "PENDING_APPROVAL"] } })
      .sort({ createdAt: -1 })
      .limit(25)
      .toArray(),
    reports.find({}).sort({ createdAt: -1 }).limit(25).toArray(),
  ]);

  const feed = [
    ...eventItems.map((item) => ({
      type: "event" as const,
      title: item.title ?? item.name ?? "Untitled event",
      organizer: item.organizerName ?? item.organizer?.name ?? "Unknown organizer",
      organization: item.organizationName ?? item.organization?.name ?? "N/A",
      school: item.schoolName ?? item.school?.name ?? "N/A",
      createdAt: new Date(item.createdAt ?? Date.now()),
    })),
    ...reportItems.map((item) => ({
      type: "report" as const,
      reportType: item.reportType ?? item.type ?? "General Report",
      event: item.eventName ?? item.event?.title ?? "Untitled event",
      reporter: item.reporterName ?? item.reporter?.name ?? "Unknown reporter",
      organizer: item.organizerName ?? item.organizer?.name ?? "Unknown organizer",
      createdAt: new Date(item.createdAt ?? Date.now()),
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map(({ createdAt, ...item }) => item);

  return { feed };
}