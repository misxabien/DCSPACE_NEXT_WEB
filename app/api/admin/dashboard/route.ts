import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAdmin } from "../../../../lib/admin/auth/roleGuard";
import { sendToGemini } from "../../../../lib/admin/ai/gemini";
<<<<<<< HEAD
=======
import { requireAdmin } from "@/lib/admin/auth/roleGuard";
import { sendToGemini } from "@/lib/admin/ai/gemini";
>>>>>>> origin/frontend-user
=======
>>>>>>> backup/backend-user
import {
  getDashboardAttendanceData,
  getDashboardCharts,
  getDashboardStats,
<<<<<<< HEAD
<<<<<<< HEAD
} from "../../../../lib/admin/db/dashboard";
=======
} from "@/lib/admin/db/dashboard";
>>>>>>> origin/frontend-user
=======
} from "../../../../lib/admin/db/dashboard";
>>>>>>> backup/backend-user

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