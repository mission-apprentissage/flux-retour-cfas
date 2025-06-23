import { NextRequest, NextResponse } from "next/server";

import { AuthContext } from "@/common/internal/AuthContext";

import { publicConfig } from "./config.public";

export const config = {
  matcher: ["/:path*"],
};

const publicPaths = ["/auth/connexion", "/auth/inscription", "/auth/inscription/profil"];

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

async function buildHeaders(
  request: NextRequest
): Promise<{ requestNextData: { request: { headers: Headers } }; session: AuthContext | null }> {
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

  return { requestNextData, session };
}

function handlePublicPaths(pathname: string, session: AuthContext | null, request: NextRequest): NextResponse | null {
  if (publicPaths.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}

function redirectToHome(
  session: AuthContext | null,
  request: NextRequest,
  requestNextData: { request: { headers: Headers } }
) {
  if (!session) {
    return NextResponse.next(requestNextData);
  }

  switch (session.organisation?.type) {
    case "MISSION_LOCALE":
      return NextResponse.redirect(new URL("/mission-locale", request.url));
    case "ARML":
      return NextResponse.redirect(new URL("/arml", request.url));
    default:
      return NextResponse.redirect(new URL("/home", request.url));
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { requestNextData, session } = await buildHeaders(request);

  handlePublicPaths(pathname, session, request);

  if (pathname === "/") {
    redirectToHome(session, request, requestNextData);
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
