import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/proxy";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/streaming/go-live-design") { return NextResponse.rewrite(new URL("/golive-studio.html", request.url)); }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
