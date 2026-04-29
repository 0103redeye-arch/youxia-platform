import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 允許跨域的來源（Expo App dev 環境）
const STATIC_ALLOWED = [
  "http://localhost:8081",
  "http://10.20.10.24:8081",
];

function getAllowedOrigins(): string[] {
  const origins = [...STATIC_ALLOWED];
  // 加入生產環境 URL（若有設定）
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !origins.includes(appUrl)) origins.push(appUrl);
  return origins;
}

export function middleware(request: NextRequest) {
  // NextAuth 自行處理 /api/auth/* 不加 CORS
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();

  // 同源請求（origin 為空，或與 host 相同）直接放行，不加 CORS 頭
  const host = request.headers.get("host") ?? "";
  if (!origin || origin.includes(host)) {
    return NextResponse.next();
  }

  // 跨域：只允許白名單來源
  const isAllowed = allowedOrigins.includes(origin);
  const allowOrigin = isAllowed ? origin : allowedOrigins[0];

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Auth-Token,Authorization",
    "Vary": "Origin",
  };

  // Preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
