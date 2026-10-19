import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PLAYER_ROUTES = [
  "/dashboard",
  "/matches",
  "/reservations",
  "/loyalty",
  "/achievements",
  "/notifications",
  "/profile",
  "/checkin",
];
const STAFF_ROUTES = ["/staff"];
const CHEF_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth =
    [...PLAYER_ROUTES, ...STAFF_ROUTES, ...CHEF_ROUTES].some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
  if (!needsAuth) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // next-auth v5 cookie name
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string;

  if (CHEF_ROUTES.some((r) => pathname.startsWith(r)) && role !== "CHEF") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (
    STAFF_ROUTES.some((r) => pathname.startsWith(r)) &&
    role !== "EMPLOYEE" &&
    role !== "CHEF"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/reservations/:path*",
    "/loyalty/:path*",
    "/achievements/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/checkin/:path*",
    "/staff/:path*",
    "/admin/:path*",
  ],
};
