import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  // API routes handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route guards
  if (pathname.startsWith("/admin") && role !== "SYSTEM_ADMIN" && role !== "RESERVATION_MANAGER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/merchant") && role !== "MERCHANT_ADMIN" && role !== "SYSTEM_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/classroom") && role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/student") && role !== "STUDENT" && role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
