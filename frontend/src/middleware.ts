import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight route gates using cookies set on login.
 * Real authorization is enforced by the API (JWT + RolesGuard).
 * Admin role design can expand later without changing this pattern.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("tolumak_session")?.value;
  const role = request.cookies.get("tolumak_role")?.value;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("redirect", pathname);
      return NextResponse.redirect(login);
    }
    if (role && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout")) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("redirect", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/checkout", "/checkout/:path*"],
};
