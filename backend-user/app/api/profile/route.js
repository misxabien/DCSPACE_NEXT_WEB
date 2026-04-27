import { NextResponse } from "next/server";
import { sanitizeUser } from "@/lib/auth-helpers";
import { requireAuth } from "@/lib/route-auth";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request) {
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
  }
  return withCors(NextResponse.json({ profile: sanitizeUser(authResult.user) }, { status: 200 }));
}
