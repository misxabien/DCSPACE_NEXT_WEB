import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeminiAnalyticsResult = {
  attendanceTrends: Array<{ label: string; value: number }>;
  peakEventTimes: Array<{ label: string; value: number }>;
  predictedAttendees: number;
};

export type AIRecommendations = {
  bestTimeToSchedule: { label: string; value: string };
  suggestedVenue: { label: string; value: string };
  targetAudience: { label: string; value: string };
  conflictWarning: { label: string; value: string };
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
}

function buildRecommendationPrompt(
  attendanceData: Array<Record<string, unknown>>,
  eventData?: Array<Record<string, unknown>>,
) {
  const attendanceSample = attendanceData.slice(0, 100).map((r) => ({
    eventTitle: r.eventTitle ?? r.eventName ?? "Untitled",
    attendedAt: r.attendedAt ?? r.tapIn ?? null,
    tapOut: r.tapOut ?? null,
    venue: r.venue ?? r.location ?? "Unknown",
    course: r.course ?? r.department ?? "Unknown",
    status: r.status ?? "Present",
  }));

  const eventSample = (eventData ?? []).slice(0, 50).map((e) => ({
    title: e.title ?? e.name ?? "Untitled",
    date: e.date ?? e.startTime ?? e.eventDate ?? null,
    startTime: e.startTime ?? e.startDate ?? null,
    endTime: e.endTime ?? e.endDate ?? null,
    venue: e.venue ?? e.location ?? "Unknown",
    course: e.course ?? "Unknown",
    status: e.status ?? "unknown",
  }));

  return `You are an analytics assistant for a school event management system called DC Space.
Analyse the following attendance and event data and return EXACTLY this JSON (no markdown fences, no extra text):

{
  "bestTimeToSchedule": { "label": "Best Time to Schedule", "value": "<short insight>" },
  "suggestedVenue": { "label": "Suggested Venue", "value": "<short insight>" },
  "targetAudience": { "label": "Target Audience", "value": "<short insight>" },
  "conflictWarning": { "label": "Conflict Warning", "value": "<short insight or 'No conflicts detected'>" }
}

Rules:
- Each "value" must be a single sentence, max 15 words.
- Base insights on actual patterns in the data below.
- For conflictWarning, check if any events share the same date.

ATTENDANCE DATA (${attendanceSample.length} records):
${JSON.stringify(attendanceSample)}

EVENT DATA (${eventSample.length} records):
${JSON.stringify(eventSample)}`;
}

function fallbackRecommendations(
  attendanceData: Array<Record<string, unknown>>,
): AIRecommendations {
  /* Derive simple recommendations from the data without an API call. */
  const hourCounts = new Map<number, number>();
  const venueCounts = new Map<string, number>();
  const courseCounts = new Map<string, number>();

  for (const r of attendanceData) {
    const raw = r.attendedAt ?? r.tapIn;
    if (typeof raw === "string") {
      const hour = new Date(raw).getHours();
      if (!Number.isNaN(hour)) {
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
    } else if (raw instanceof Date) {
      hourCounts.set(raw.getHours(), (hourCounts.get(raw.getHours()) ?? 0) + 1);
    }

    const venue = (r.venue ?? r.location ?? "").toString().trim();
    if (venue) venueCounts.set(venue, (venueCounts.get(venue) ?? 0) + 1);

    const course = (r.course ?? r.department ?? "").toString().trim();
    if (course) courseCounts.set(course, (courseCounts.get(course) ?? 0) + 1);
  }

  const topHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topVenue = [...venueCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCourse = [...courseCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    bestTimeToSchedule: {
      label: "Best Time to Schedule",
      value: topHour
        ? `${topHour[0]}:00 has the highest attendance rate`
        : "Not enough data to determine peak time",
    },
    suggestedVenue: {
      label: "Suggested Venue",
      value: topVenue
        ? `Use ${topVenue[0]} for large attendee events`
        : "Not enough data to suggest a venue",
    },
    targetAudience: {
      label: "Target Audience",
      value: topCourse
        ? `${topCourse[0]} students are most likely to attend`
        : "Not enough data to identify target audience",
    },
    conflictWarning: {
      label: "Conflict Warning",
      value: "No conflicts detected",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Sends attendance data to the Gemini analytics layer and returns summarized insights.
 * Falls back to local aggregation when no API key is configured.
 */
export async function sendToGemini(
  attendanceData: Array<Record<string, unknown>>,
): Promise<GeminiAnalyticsResult> {
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

  const predictedAttendees =
    attendanceData.length === 0
      ? 0
      : Math.max(1, Math.round(attendanceData.length / Math.max(attendanceTrends.length, 1)));

  return {
    attendanceTrends,
    peakEventTimes,
    predictedAttendees,
  };
}

/**
 * Calls the Gemini API to generate smart AI recommendations for the dashboard.
 * Falls back to local heuristic analysis when the API key is not set or the call fails.
 */
export async function getAIRecommendations(
  attendanceData: Array<Record<string, unknown>>,
  eventData?: Array<Record<string, unknown>>,
): Promise<AIRecommendations> {
  const client = getGeminiClient();

  if (!client) {
    console.warn("GEMINI_API_KEY not set — using fallback recommendations");
    return fallbackRecommendations(attendanceData);
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = buildRecommendationPrompt(attendanceData, eventData);

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    /* Strip markdown fences if the model wraps the JSON anyway. */
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as AIRecommendations;

    /* Validate shape — every key must have label + value */
    const keys = ["bestTimeToSchedule", "suggestedVenue", "targetAudience", "conflictWarning"] as const;
    for (const key of keys) {
      if (!parsed[key]?.label || !parsed[key]?.value) {
        throw new Error(`Missing or malformed key: ${key}`);
      }
    }

    return parsed;
  } catch (error) {
    console.error("Gemini API call failed, falling back to local analysis:", error);
    return fallbackRecommendations(attendanceData);
  }
}