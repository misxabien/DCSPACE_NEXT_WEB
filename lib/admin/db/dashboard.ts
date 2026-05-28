/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserDb } from '@/lib/user-server/get-user-db';

async function getDatabase() {
  return getUserDb();
}

function toDateKey(value: Date | string | null | undefined) {
  if (!value) {
    return 'Unknown';
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function toHourLabel(value: Date | string | null | undefined) {
  if (!value) {
    return 'Unknown';
  }

  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

/**
 * Returns the dashboard headline statistics from MongoDB.
 */
export async function getDashboardStats() {
  const db = await getDatabase();
  const events = db.collection<any>('events');
  const attendance = db.collection<any>('attendance_logs');

  const [totalEvents, totalAttendees, totalCertificates, organizations] = await Promise.all([
    events.countDocuments({}),
    attendance.countDocuments({}),
    attendance.countDocuments({ certificateId: { $exists: true, $ne: null } }),
    events.distinct('organization'),
  ]);

  return {
    totalEvents,
    totalAttendees,
    totalCertificates,
    totalOrganizations: organizations.filter(Boolean).length,
  };
}

/**
 * Returns the attendance records used for Gemini analytics generation.
 */
export async function getDashboardAttendanceData() {
  const db = await getDatabase();
  const attendance = db.collection<any>('attendance_logs');
  const records = await attendance.find({}).sort({ createdAt: -1 }).limit(500).toArray();

  return records.map((record) => ({
    eventId: record.eventId ?? null,
    eventTitle: record.eventTitle ?? record.eventName ?? 'Untitled event',
    attendedAt: record.attendedAt ?? record.updatedAt ?? record.createdAt ?? null,
    tapOut: record.tapOut ?? null,
    attendeeId: record.attendeeId ?? record.userId ?? null,
    attendeeName: record.attendeeName ?? record.fullName ?? record.name ?? 'Unknown attendee',
    status: record.status ?? record.attendanceStatus ?? 'Present',
  }));
}

/**
 * Builds chart datasets from attendance data for the analytics dashboard.
 */
export function getDashboardCharts(attendanceData: Array<Record<string, unknown>>) {
  const eventsByDate = new Map<string, number>();
  const attendeesByHour = new Map<string, number>();

  for (const record of attendanceData) {
    const attendedAt = typeof record.attendedAt === 'string' || record.attendedAt instanceof Date
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
          label: 'Attendance Trend',
          data: Array.from(eventsByDate.values()),
        },
      ],
    },
    peakTimes: {
      labels: Array.from(attendeesByHour.keys()),
      datasets: [
        {
          label: 'Peak Event Times',
          data: Array.from(attendeesByHour.values()),
        },
      ],
    },
  };
}
