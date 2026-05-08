import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CORS headers are handled globally via next.config.js (Access-Control-Allow-Origin: *)
// This middleware only handles preflight OPTIONS requests not covered by next.config.js static headers.
export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Auth-Token,Authorization",
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
