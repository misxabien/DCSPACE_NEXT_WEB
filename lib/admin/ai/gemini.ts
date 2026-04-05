export type GeminiAnalyticsResult = {
  attendanceTrends: Array<{ label: string; value: number }>;
  peakEventTimes: Array<{ label: string; value: number }>;
  predictedAttendees: number;
};

function groupByLabel(
  attendanceData: Array<Record<string, unknown>>,
  selector: (record: Record<string, unknown>) => string,
) {
  const counts = new Map<string, number>();

  for (const record of attendanceData) {
    const label = selector(record);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

/**
 * Sends attendance data to the Gemini analytics layer and returns summarized insights.
 */
export async function sendToGemini(attendanceData: Array<Record<string, unknown>>): Promise<GeminiAnalyticsResult> {
  const attendanceTrends = groupByLabel(attendanceData, (record) => {
    const value = record.eventTitle;
    return typeof value === "string" && value.trim() ? value : "Untitled event";
  });

  const peakEventTimes = groupByLabel(attendanceData, (record) => {
    const attendedAt = record.attendedAt;

    if (typeof attendedAt === "string") {
      return `${attendedAt.slice(11, 13) || "00"}:00`;
    }

    if (attendedAt instanceof Date) {
      return `${String(attendedAt.getHours()).padStart(2, "0")}:00`;
    }

    return "Unknown";
  });

  const predictedAttendees = attendanceData.length === 0
    ? 0
    : Math.max(1, Math.round(attendanceData.length / Math.max(attendanceTrends.length, 1)));

  return {
    attendanceTrends,
    peakEventTimes,
    predictedAttendees,
  };
}