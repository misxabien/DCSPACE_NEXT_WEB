import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getNextAuthSecret } from "./lib/admin/auth/devAdmin";

/** Student/user app routes — not used on the frontend-admin-user branch. */
const USER_APP_PREFIXES = [
  "/home",
  "/login",
  "/register",
  "/forgot-password",
  "/attendance",
  "/certificates",
  "/dashboard",
  "/events-organized",
  "/events",
  "/hover",
  "/my-profile",
  "/organize",
  "/notifications",
  "/submit-feedback",
] as const;

function isUserAppRoute(pathname: string) {
  return USER_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isUserAppRoute(pathname)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

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
    "/admin",
    "/admin/:path*",
    "/home",
    "/home/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/attendance/:path*",
    "/certificates/:path*",
    "/dashboard/:path*",
    "/events-organized/:path*",
    "/events/:path*",
    "/hover/:path*",
    "/my-profile/:path*",
    "/organize/:path*",
    "/notifications/:path*",
    "/submit-feedback/:path*",
    "/api/admin/((?!auth/).+)",
  ],
};
