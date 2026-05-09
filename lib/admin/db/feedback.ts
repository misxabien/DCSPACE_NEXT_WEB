/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";

const globalForMongo = globalThis as unknown as {
  adminFeedbackMongoClient?: MongoClient;
  adminFeedbackMongoPromise?: Promise<MongoClient>;
};

async function getMongoClient() {
  if (globalForMongo.adminFeedbackMongoClient) {
    return globalForMongo.adminFeedbackMongoClient;
  }

  if (!globalForMongo.adminFeedbackMongoPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo.adminFeedbackMongoPromise = client.connect();
  }

  globalForMongo.adminFeedbackMongoClient = await globalForMongo.adminFeedbackMongoPromise;
  return globalForMongo.adminFeedbackMongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}

function toNumericRating(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundAverage(value: number) {
  return Number(value.toFixed(2));
}

function formatTimeLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeRegistrationType(record: any) {
  const rawType = (
    record.registrationType ??
    record.feedbackType ??
    record.scope ??
    record.category ??
    "event"
  )
    .toString()
    .trim()
    .toLowerCase();

  return rawType.includes("system") ? "System" : "Event";
}

function normalizeAttendanceStatus(value: unknown) {
  const normalized = (value ?? "pending").toString().trim().toLowerCase();

  if (["completed", "complete", "present", "attended"].includes(normalized)) {
    return "Completed";
  }

  return "Pending";
}

function normalizeCertificateStatus(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "issued" : "-";
  }

  const normalized = (value ?? "").toString().trim().toLowerCase();

  if (!normalized || normalized === "pending" || normalized === "-" || normalized === "none") {
    return "-";
  }

  if (normalized.includes("issued")) {
    return "issued";
  }

  return value?.toString() ?? "-";
}

function getEventRating(record: any) {
  return toNumericRating(record.eventRating ?? record.rating ?? record.score);
}

function getSystemRating(record: any) {
  return toNumericRating(record.systemEaseOfUse ?? record.systemRating ?? record.usabilityRating ?? record.rating ?? record.score);
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return roundAverage(total / values.length);
}

function mapFeedbackRow(record: any) {
  const registrationType = normalizeRegistrationType(record);
  const rating = registrationType === "System" ? getSystemRating(record) : getEventRating(record);

  return {
    rating: rating ?? 0,
    ratingOutOf: Number(record.ratingOutOf ?? record.outOf ?? 5),
    registrationType,
    tapIn: formatTimeLabel(record.tapIn ?? record.attendance?.tapIn ?? null),
    tapOut: formatTimeLabel(record.tapOut ?? record.attendance?.tapOut ?? null),
    attendanceStatus: normalizeAttendanceStatus(record.attendanceStatus ?? record.attendance?.status),
    eCertificate: normalizeCertificateStatus(
      record.eCertificate ?? record.certificateStatus ?? record.attendance?.certificateStatus,
    ),
  };
}

/**
 * Returns the feedback overview stats and table rows for the admin feedback screen.
 */
export async function getFeedbackOverview() {
  const db = await getDatabase();
  const feedback = db.collection<any>("feedback");
  const records = await feedback.find({}).sort({ createdAt: -1, updatedAt: -1 }).limit(500).toArray();

  const eventRatings: number[] = [];
  const systemRatings: number[] = [];

  for (const record of records) {
    const registrationType = normalizeRegistrationType(record);

    if (registrationType === "System") {
      const systemRating = getSystemRating(record);

      if (systemRating !== null) {
        systemRatings.push(systemRating);
      }

      continue;
    }

    const eventRating = getEventRating(record);

    if (eventRating !== null) {
      eventRatings.push(eventRating);
    }
  }

  return {
    averageEventRating: getAverage(eventRatings),
    averageEventRatingOutOf: 5,
    averageEventRatingCount: eventRatings.length,
    systemEaseOfUse: getAverage(systemRatings),
    systemEaseOfUseOutOf: 5,
    systemEaseOfUseCount: systemRatings.length,
    feedbackList: records.map(mapFeedbackRow),
  };
}

