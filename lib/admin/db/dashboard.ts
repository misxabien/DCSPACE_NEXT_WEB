/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";

const globalForMongo = globalThis as unknown as {
  adminDashboardMongoClient?: MongoClient;
  adminDashboardMongoPromise?: Promise<MongoClient>;
};

async function getMongoClient() {
  if (globalForMongo.adminDashboardMongoClient) {
    return globalForMongo.adminDashboardMongoClient;
  }

  if (!globalForMongo.adminDashboardMongoPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo.adminDashboardMongoPromise = client.connect();
  }

  globalForMongo.adminDashboardMongoClient = await globalForMongo.adminDashboardMongoPromise;
  return globalForMongo.adminDashboardMongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}

function toDateKey(value: Date | string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function toHourLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

/**
 * Returns the dashboard headline statistics from MongoDB.
 */
export async function getDashboardStats() {
  const db = await getDatabase();
  const events = db.collection<any>("events");
  const attendance = db.collection<any>("attendance");

  const [totalEvents, totalAttendees] = await Promise.all([
    events.countDocuments({}),
    attendance.countDocuments({}),
  ]);

  return {
    totalEvents,
    totalAttendees,
  };
}

/**
 * Returns the attendance records used for Gemini analytics generation.
 */
export async function getDashboardAttendanceData() {
  const db = await getDatabase();
  const attendance = db.collection<any>("attendance");
  const records = await attendance.find({}).sort({ createdAt: -1 }).limit(500).toArray();

  return records.map((record) => ({
    eventId: record.eventId ?? null,
    eventTitle: record.eventTitle ?? record.eventName ?? "Untitled event",
    attendedAt: record.attendedAt ?? record.tapIn ?? record.createdAt ?? null,
    tapOut: record.tapOut ?? null,
    attendeeId: record.attendeeId ?? record.userId ?? null,
    attendeeName: record.attendeeName ?? record.name ?? "Unknown attendee",
    status: record.status ?? "Present",
  }));
}

/**
 * Builds chart datasets from attendance data for the analytics dashboard.
 */
export function getDashboardCharts(attendanceData: Array<Record<string, unknown>>) {
  const eventsByDate = new Map<string, number>();
  const attendeesByHour = new Map<string, number>();

  for (const record of attendanceData) {
    const attendedAt = typeof record.attendedAt === "string" || record.attendedAt instanceof Date
      ? record.attendedAt
      : null;

    const dateKey = toDateKey(attendedAt);
    const hourKey = toHourLabel(attendedAt);

    eventsByDate.set(dateKey, (eventsByDate.get(dateKey) ?? 0) + 1);
    attendeesByHour.set(hourKey, (attendeesByHour.get(hourKey) ?? 0) + 1);
  }

  return {
    attendanceTrend: {
      labels: Array.from(eventsByDate.keys()),
      datasets: [
        {
          label: "Attendance Trend",
          data: Array.from(eventsByDate.values()),
        },
      ],
    },
    peakTimes: {
      labels: Array.from(attendeesByHour.keys()),
      datasets: [
        {
          label: "Peak Event Times",
          data: Array.from(attendeesByHour.values()),
        },
      ],
    },
  };
}
