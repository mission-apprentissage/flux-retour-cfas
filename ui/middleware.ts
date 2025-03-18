import { NextRequest, NextResponse } from "next/server";

import { AuthContext } from "@/common/internal/AuthContext";

import { publicConfig } from "./config.public";

export const config = {
  matcher: ["/:path*"],
};

async function fetchSession(request: NextRequest): Promise<AuthContext | null> {
  try {
    const cookie = request.cookies.get("flux-retour-cfas-local-jwt");
    if (!cookie) return null;

    const response = await fetch(`${publicConfig.baseUrl.replace(/\/$/, "")}/api/v1/session`, {
      headers: { cookie: `flux-retour-cfas-local-jwt=${cookie.value}` },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);

  const session = await fetchSession(request);

  requestHeaders.set("x-session", JSON.stringify(session));

  const requestNextData = {
    request: {
      headers: requestHeaders,
    },
  };

  if (pathname === "/") {
    if (session) {
      return session.organisation?.type === "MISSION_LOCALE"
        ? NextResponse.redirect(new URL("/mission-locale", request.url))
        : NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next(requestNextData);
  }

  if (pathname === "/mission-locale") {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (session.organisation?.type !== "MISSION_LOCALE") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next(requestNextData);
  }

  return NextResponse.next(requestNextData);
}
