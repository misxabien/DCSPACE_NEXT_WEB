/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminCollection } from "./mongo";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const FACILITY_KEYS = [
  "DRA_HALL", "AVR", "STUDIO_THEATER", "CONFERENCE_HALL", "SKYLINE",
] as const;

/* ------------------------------------------------------------------ */
/*  Collection helpers                                                */
/* ------------------------------------------------------------------ */

async function getEventsCollection() {
  return getAdminCollection<any>("events");
}

async function getAttendanceCollection() {
  return getAdminCollection<any>("attendance");
}

async function getCertificatesCollection() {
  return getAdminCollection<any>("certificates");
}

async function getUsersCollection() {
  return getAdminCollection<any>("users");
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                      */
/* ------------------------------------------------------------------ */

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

function getMonthRange(offsetMonths: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 1);
  return { start, end };
}

function growthPercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function normalizeVenueKey(venue: string): (typeof FACILITY_KEYS)[number] | null {
  const v = venue.toUpperCase().replace(/[\s\-_]+/g, "_");

  if (v.includes("DRA")) return "DRA_HALL";
  if (v.includes("AVR")) return "AVR";
  if (v.includes("STUDIO") || v.includes("THEATER")) return "STUDIO_THEATER";
  if (v.includes("CONFERENCE")) return "CONFERENCE_HALL";
  if (v.includes("SKYLINE")) return "SKYLINE";

  return null;
}

/* ------------------------------------------------------------------ */
/*  Stats                                                             */
/* ------------------------------------------------------------------ */

/**
 * Returns the dashboard headline statistics from MongoDB.
 */
export async function getDashboardStats() {
  const [events, attendance, certificates, users] = await Promise.all([
    getEventsCollection(),
    getAttendanceCollection(),
    getCertificatesCollection(),
    getUsersCollection(),
  ]);

  const currentMonth = getMonthRange(0);
  const prevMonth = getMonthRange(-1);

  const dateFilter = (range: { start: Date; end: Date }) => ({
    createdAt: { $gte: range.start, $lt: range.end },
  });

  const [
    totalEvents,
    totalAttendees,
    totalCertificates,
    totalOrganizations,
    currentMonthEvents,
    prevMonthEvents,
    currentMonthAttendees,
    prevMonthAttendees,
    currentMonthCerts,
    prevMonthCerts,
    currentMonthOrgs,
    prevMonthOrgs,
  ] = await Promise.all([
    events.countDocuments({}),
    attendance.countDocuments({}),
    certificates.countDocuments({}),
    users.distinct("organizationName").then((orgs: any[]) =>
      orgs.filter((o) => o && o !== "Unassigned" && o !== "N/A").length,
    ),
    events.countDocuments(dateFilter(currentMonth)),
    events.countDocuments(dateFilter(prevMonth)),
    attendance.countDocuments(dateFilter(currentMonth)),
    attendance.countDocuments(dateFilter(prevMonth)),
    certificates.countDocuments(dateFilter(currentMonth)),
    certificates.countDocuments(dateFilter(prevMonth)),
    users.distinct("organizationName", dateFilter(currentMonth)).then((o: any[]) =>
      o.filter((v) => v && v !== "Unassigned" && v !== "N/A").length,
    ),
    users.distinct("organizationName", dateFilter(prevMonth)).then((o: any[]) =>
      o.filter((v) => v && v !== "Unassigned" && v !== "N/A").length,
    ),
  ]);

  return {
    totalEvents,
    totalAttendees,
    totalCertificates,
    totalOrganizations,
    eventGrowth: growthPercent(currentMonthEvents, prevMonthEvents),
    attendeeGrowth: growthPercent(currentMonthAttendees, prevMonthAttendees),
    certGrowth: growthPercent(currentMonthCerts, prevMonthCerts),
    orgGrowth: growthPercent(currentMonthOrgs, prevMonthOrgs),
  };
}

/* ------------------------------------------------------------------ */
/*  Key Event Insights — event counts by course                       */
/* ------------------------------------------------------------------ */

export async function getKeyEventInsights() {
  const events = await getEventsCollection();
  const pipeline = [
    { $match: { course: { $exists: true, $ne: null } } },
    { $group: { _id: "$course", count: { $sum: 1 } } },
    { $sort: { count: -1 as const } },
    { $limit: 10 },
    { $project: { _id: 0, course: "$_id", count: 1 } },
  ];

  return events.aggregate(pipeline).toArray();
}

/* ------------------------------------------------------------------ */
/*  Top Engaged Courses — attendance counts by course                 */
/* ------------------------------------------------------------------ */

export async function getTopEngagedCourses() {
  const attendance = await getAttendanceCollection();

  /* Try a lookup on the event to get course info. */
  const pipeline = [
    { $group: { _id: "$eventId", count: { $sum: 1 } } },
    { $sort: { count: -1 as const } },
    { $limit: 20 },
  ];

  const eventCounts = await attendance.aggregate(pipeline).toArray();

  if (eventCounts.length === 0) {
    return [];
  }

  /* Fetch the event details to get course info. */
  const events = await getEventsCollection();
  const eventIds = eventCounts.map((e: any) => e._id).filter(Boolean);
  const eventDocs = await events
    .find({ $or: eventIds.map((id: any) => ({ _id: id })) })
    .toArray();

  const courseMap = new Map<string, any>();
  for (const doc of eventDocs) {
    courseMap.set(String(doc._id), doc.course ?? "Unknown");
  }

  const courseCounts = new Map<string, number>();
  for (const ec of eventCounts) {
    const course = courseMap.get(String(ec._id)) ?? "Unknown";
    courseCounts.set(course, (courseCounts.get(course) ?? 0) + ec.count);
  }

  return Array.from(courseCounts.entries())
    .map(([course, count]) => ({ course, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Most Used Facilities — venue usage by month (12 months)           */
/* ------------------------------------------------------------------ */

export async function getMostUsedFacilities() {
  const events = await getEventsCollection();
  const now = new Date();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

  const docs = await events
    .find({ createdAt: { $gte: yearAgo } })
    .project({ venue: 1, location: 1, createdAt: 1 })
    .toArray();

  /* Build the 12-month grid. */
  const monthGrid: Record<string, Record<(typeof FACILITY_KEYS)[number], number>> = {};

  for (const label of MONTH_LABELS) {
    const entry: Record<string, number> = {};
    for (const key of FACILITY_KEYS) {
      entry[key] = 0;
    }
    monthGrid[label] = entry as Record<(typeof FACILITY_KEYS)[number], number>;
  }

  for (const doc of docs) {
    const rawVenue = (doc.venue ?? doc.location ?? "").toString();
    const facilityKey = normalizeVenueKey(rawVenue);

    if (!facilityKey) continue;

    const date = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt);
    const monthLabel = MONTH_LABELS[date.getMonth()];

    if (monthGrid[monthLabel]) {
      monthGrid[monthLabel][facilityKey] += 1;
    }
  }

  return MONTH_LABELS.map((month) => ({
    month,
    ...monthGrid[month],
  }));
}

/* ------------------------------------------------------------------ */
/*  Attendance data for Gemini + Charts                               */
/* ------------------------------------------------------------------ */

/**
 * Returns the attendance records used for Gemini analytics generation.
 */
export async function getDashboardAttendanceData() {
  const attendance = await getAttendanceCollection();
  const records = await attendance.find({}).sort({ createdAt: -1 }).limit(500).toArray();

  return records.map((record: any) => ({
    eventId: record.eventId ?? null,
    eventTitle: record.eventTitle ?? record.eventName ?? "Untitled event",
    attendedAt: record.attendedAt ?? record.tapIn ?? record.createdAt ?? null,
    tapOut: record.tapOut ?? null,
    attendeeId: record.attendeeId ?? record.userId ?? null,
    attendeeName: record.attendeeName ?? record.name ?? "Unknown attendee",
    status: record.status ?? "Present",
    venue: record.venue ?? record.location ?? null,
    course: record.course ?? record.department ?? null,
  }));
}

/**
 * Returns the raw event documents for Gemini AI context.
 */
export async function getDashboardEventData() {
  const events = await getEventsCollection();
  return events.find({}).sort({ createdAt: -1 }).limit(100).toArray();
}

/**
 * Builds chart datasets from attendance data for the analytics dashboard.
 */
export function getDashboardCharts(attendanceData: Array<Record<string, unknown>>) {
  const eventsByDate = new Map<string, number>();
  const attendeesByHour = new Map<string, number>();

  for (const record of attendanceData) {
    const attendedAt =
      typeof record.attendedAt === "string" || record.attendedAt instanceof Date
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
