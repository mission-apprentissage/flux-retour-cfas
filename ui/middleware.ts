import { NextRequest, NextResponse } from "next/server";

import { AuthContext } from "@/common/internal/AuthContext";

import { publicConfig } from "./config.public";

export const config = {
  matcher: ["/:path*"],
};

async function fetchSession(request: NextRequest): Promise<AuthContext | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;
    const response = await fetch(`${publicConfig.baseUrl.replace(/\/$/, "")}/api/v1/session`, {
      headers: { cookie: cookieHeader },
      credentials: "include",
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await fetchSession(request);
  const requestHeaders = new Headers(request.headers);

  if (session) {
    const encodedSession = Buffer.from(JSON.stringify(session), "utf-8").toString("base64");
    requestHeaders.set("x-session", encodedSession);
  } else {
    requestHeaders.delete("x-session");
  }

  const requestNextData = {
    request: {
      headers: requestHeaders,
    },
  };

  if (pathname === "/") {
    if (session) {
      if (session.organisation?.type === "MISSION_LOCALE") {
        return NextResponse.redirect(new URL("/mission-locale", request.url));
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next(requestNextData);
  }

  if (pathname === "/campagnes/mission-locale") {
    return NextResponse.next();
  }

  if (session && pathname === "/auth/connexion") {
    return NextResponse.redirect(new URL("/", request.url));
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
