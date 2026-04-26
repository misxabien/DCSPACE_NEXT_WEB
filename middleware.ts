import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/admin");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized", code: 401 },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", code: 403 },
      { status: 403 },
    );
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
