import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { sendToGemini } from "../../../../lib/admin/ai/gemini";
import {
  getDashboardAttendanceData,
  getDashboardCharts,
  getDashboardStats,
} from "../../../../lib/admin/db/dashboard";

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminAuthorizationError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();

    const [stats, attendanceData] = await Promise.all([
      getDashboardStats(),
      getDashboardAttendanceData(),
    ]);

    const [aiAnalytics, charts] = await Promise.all([
      sendToGemini(attendanceData),
      Promise.resolve(getDashboardCharts(attendanceData)),
    ]);

    return NextResponse.json(
      {
        ...stats,
        aiAnalytics,
        charts,
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}