import { NextResponse } from "next/server";
import { APP_PREFIXES, AUTH_PATHS } from "@/constants/routes";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session =
    request.cookies.get("sid")?.value ||
    request.cookies.get("access_token")?.value;

  // If user visits root "/", redirect to /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user tries to access protected app routes without session, redirect to /login
  if (APP_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
