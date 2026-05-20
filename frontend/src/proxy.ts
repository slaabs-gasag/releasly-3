import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isAuthenticated = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthRoute =
    pathname.startsWith("/auth") || pathname.startsWith("/api/auth");

  if (!isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
