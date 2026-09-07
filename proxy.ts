import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authEnabled, isValidToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/unlock")) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (await isValidToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Snapshot files are fetched by the image optimizer without cookies, so they stay outside the gate.
  matcher: ["/((?!_next/static|_next/image|api/shots|api/blob|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
