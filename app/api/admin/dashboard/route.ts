import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { getAIRecommendations, sendToGemini } from "../../../../lib/admin/ai/gemini";
import {
  getDashboardAttendanceData,
  getDashboardCharts,
  getDashboardEventData,
  getDashboardStats,
  getKeyEventInsights,
  getMostUsedFacilities,
  getTopEngagedCourses,
} from "../../../../lib/admin/db/dashboard";
import { toErrorResponse } from "../../../../lib/admin/errors";

export async function GET() {
  try {
    await requireAdmin();

    const [stats, attendanceData, eventData] = await Promise.all([
      getDashboardStats(),
      getDashboardAttendanceData(),
      getDashboardEventData(),
    ]);

    const [
      aiAnalytics,
      charts,
      keyEventInsights,
      topEngagedCourse,
      mostUsedFacilities,
      aiRecommendations,
    ] = await Promise.all([
      sendToGemini(attendanceData),
      Promise.resolve(getDashboardCharts(attendanceData)),
      getKeyEventInsights(),
      getTopEngagedCourses(),
      getMostUsedFacilities(),
      getAIRecommendations(attendanceData, eventData),
    ]);

    return NextResponse.json(
      {
        stats,
        keyEventInsights,
        topEngagedCourse,
        mostUsedFacilities,
        aiRecommendations,
        aiAnalytics,
        charts,
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}