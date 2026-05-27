import { NextResponse } from "next/server";
import { sanitizeUser } from "@/lib/auth-helpers";
import { requireAuth } from "@/lib/route-auth";

export async function GET(request: Request) {
  const authResult = await requireAuth(request);

  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  return NextResponse.json({ profile: sanitizeUser(authResult.user) }, { status: 200 });
}
