import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getNextAuthSecret } from "./lib/admin/auth/devAdmin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: getNextAuthSecret(),
  });

  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/attendance/:path*",
    "/certificates/:path*",
    "/dashboard/:path*",
    "/events/:path*",
    "/hover/:path*",
    "/my-profile/:path*",
    "/organize/:path*",
    "/api/admin/((?!auth/).+)",
  ],
};
