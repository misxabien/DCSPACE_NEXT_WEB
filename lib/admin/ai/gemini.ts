export type GeminiAnalyticsResult = {
  attendanceTrends: Array<{ label: string; value: number }>;
  peakEventTimes: Array<{ label: string; value: number }>;
  predictedAttendees: number;
  recommendations: Array<{ title: string; body: string }>;
};

type Recommendation = GeminiAnalyticsResult['recommendations'][number];

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

function buildLocalAnalytics(attendanceData: Array<Record<string, unknown>>): GeminiAnalyticsResult {
  const attendanceTrends = groupByLabel(attendanceData, (record) => {
    const value = record.eventTitle;
    return typeof value === 'string' && value.trim() ? value : 'Untitled event';
  });

  const peakEventTimes = groupByLabel(attendanceData, (record) => {
    const attendedAt = record.attendedAt;

    if (typeof attendedAt === 'string') {
      return `${attendedAt.slice(11, 13) || '00'}:00`;
    }

    if (attendedAt instanceof Date) {
      return `${String(attendedAt.getHours()).padStart(2, '0')}:00`;
    }

    return 'Unknown';
  });

  const predictedAttendees = attendanceData.length === 0
    ? 0
    : Math.max(1, Math.round(attendanceData.length / Math.max(attendanceTrends.length, 1)));
  const topEvent = [...attendanceTrends].sort((a, b) => b.value - a.value)[0];
  const peakTime = [...peakEventTimes].sort((a, b) => b.value - a.value)[0];
  const recommendations =
    attendanceData.length === 0
      ? [
          {
            title: 'Collect Attendance Data',
            body: 'No attendance logs are available yet. Start RFID tapping to generate event analytics.',
          },
        ]
      : [
          {
            title: 'Best Time to Schedule',
            body: `${peakTime?.label ?? 'Unknown'} currently has the highest recorded attendance.`,
          },
          {
            title: 'Top Performing Event',
            body: `${topEvent?.label ?? 'Untitled event'} has the strongest attendance signal so far.`,
          },
          {
            title: 'Expected Attendees',
            body: `Based on recent attendance logs, expect about ${predictedAttendees} attendee(s) per event.`,
          },
        ];

  return {
    attendanceTrends,
    peakEventTimes,
    predictedAttendees,
    recommendations,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function normalizeRecommendations(value: unknown): Recommendation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const body = typeof item.body === 'string' ? item.body.trim() : '';

      if (!title || !body) {
        return null;
      }

      return { title, body };
    })
    .filter((item): item is Recommendation => Boolean(item))
    .slice(0, 4);
}

function extractGeminiText(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
    return '';
  }

  const firstCandidate = payload.candidates[0];
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content)) {
    return '';
  }

  const parts = firstCandidate.content.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => isRecord(part) && typeof part.text === 'string' ? part.text : '')
    .join('')
    .trim();
}

function parseGeminiAnalytics(text: string) {
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(stripJsonFence(text));
    if (!isRecord(parsed)) {
      return null;
    }

    const recommendations = normalizeRecommendations(parsed.recommendations);
    const predictedAttendees = Number(parsed.predictedAttendees);

    return {
      predictedAttendees: Number.isFinite(predictedAttendees) && predictedAttendees >= 0
        ? Math.round(predictedAttendees)
        : null,
      recommendations,
    };
  } catch {
    return null;
  }
}

function buildGeminiPrompt(
  attendanceData: Array<Record<string, unknown>>,
  localAnalytics: GeminiAnalyticsResult,
) {
  const compactRows = attendanceData.slice(0, 120).map((record) => ({
    eventTitle: record.eventTitle,
    attendedAt: record.attendedAt,
    tapOut: record.tapOut,
    attendeeName: record.attendeeName,
    status: record.status,
  }));

  return [
    'You are generating smart event recommendations for an admin analytics dashboard.',
    'Use the attendance data to produce practical scheduling and operations advice.',
    'Return only valid JSON with this exact shape:',
    '{"predictedAttendees": number, "recommendations": [{"title": string, "body": string}]}',
    'Keep each recommendation body under 24 words.',
    `Local summary: ${JSON.stringify({
      attendanceTrends: localAnalytics.attendanceTrends,
      peakEventTimes: localAnalytics.peakEventTimes,
      predictedAttendees: localAnalytics.predictedAttendees,
    })}`,
    `Attendance rows: ${JSON.stringify(compactRows)}`,
  ].join('\n');
}

function normalizeGeminiModel(value: string) {
  return value.trim().replace(/^models\//, '') || 'gemini-2.5-flash';
}

async function requestGeminiAnalytics(
  attendanceData: Array<Record<string, unknown>>,
  localAnalytics: GeminiAnalyticsResult,
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = normalizeGeminiModel(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildGeminiPrompt(attendanceData, localAnalytics) }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as unknown;
    return parseGeminiAnalytics(extractGeminiText(payload));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends attendance data to Gemini when GEMINI_API_KEY is available, with local analytics as fallback.
 */
export async function sendToGemini(attendanceData: Array<Record<string, unknown>>): Promise<GeminiAnalyticsResult> {
  const localAnalytics = buildLocalAnalytics(attendanceData);
  const geminiAnalytics = await requestGeminiAnalytics(attendanceData, localAnalytics);

  if (!geminiAnalytics) {
    return localAnalytics;
  }

  return {
    ...localAnalytics,
    predictedAttendees: geminiAnalytics.predictedAttendees ?? localAnalytics.predictedAttendees,
    recommendations: geminiAnalytics.recommendations.length
      ? geminiAnalytics.recommendations
      : localAnalytics.recommendations,
  };
}
