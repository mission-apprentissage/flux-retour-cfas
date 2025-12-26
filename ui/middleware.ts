import { NextRequest, NextResponse } from "next/server";

import { AuthContext } from "@/common/internal/AuthContext";

import { publicConfig } from "./config.public";

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
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

function handlePublicPaths(
  pathname: string,
  session: AuthContext | null,
  request: NextRequest,
  requestNextData: { request: { headers: Headers } }
): NextResponse | undefined {
  if (publicPaths.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next(requestNextData);
  }
}

function handleProfileCompletion(
  pathname: string,
  session: AuthContext | null,
  request: NextRequest,
  requestNextData: { request: { headers: Headers } }
): NextResponse | undefined {
  if (!session) {
    return NextResponse.next(requestNextData);
  }

  if (session.account_status === "PENDING_PROFILE_COMPLETION") {
    if (pathname === "/auth/pro-connect/profil") {
      return NextResponse.next(requestNextData);
    }
    return NextResponse.redirect(new URL("/auth/pro-connect/profil", request.url));
  }
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
    case "ACADEMIE":
      return NextResponse.redirect(new URL("/voeux-affelnet", request.url));
    case "FRANCE_TRAVAIL":
      return NextResponse.redirect(new URL("/france-travail", request.url));
    case "DREETS":
    case "DDETS":
      return NextResponse.redirect(new URL("/suivi-des-indicateurs", request.url));
    case "ORGANISME_FORMATION":
      if (session.organisation?.ml_beta_activated_at) {
        return NextResponse.redirect(new URL("/cfa", request.url));
      }
      return NextResponse.redirect(new URL("/home", request.url));
    default:
      return NextResponse.redirect(new URL("/home", request.url));
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { requestNextData, session } = await buildHeaders(request);

  const publicPath = handlePublicPaths(pathname, session, request, requestNextData);

  if (publicPath) {
    return publicPath;
  }

  const profileCompletion = handleProfileCompletion(pathname, session, request, requestNextData);

  if (profileCompletion) {
    return profileCompletion;
  }

  if (pathname === "/") {
    return redirectToHome(session, request, requestNextData);
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

  if (pathname === "/france-travail") {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (session.organisation?.type !== "FRANCE_TRAVAIL") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next(requestNextData);
  }

  if (pathname === "/cfa") {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (session.organisation?.type !== "ORGANISME_FORMATION" || !session.organisation?.ml_beta_activated_at) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next(requestNextData);
  }

  const isDreetsOrDdets = session?.organisation?.type === "DREETS" || session?.organisation?.type === "DDETS";
  if (isDreetsOrDdets) {
    const restrictedPaths = ["/home", "/organismes", "/indicateurs", "/national/indicateurs", "/voeux-affelnet"];
    const isRestrictedPath = restrictedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if (isRestrictedPath) {
      return NextResponse.redirect(new URL("/suivi-des-indicateurs", request.url));
    }
  }

  if (pathname === "/parametres") {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (session.organisation?.type !== "ORGANISME_FORMATION") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (session.organisation?.ml_beta_activated_at) {
      const url = new URL("/cfa/parametres", request.url);

      const originalUrl = new URL(request.url);
      originalUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      return NextResponse.redirect(url);
    }
    return NextResponse.next(requestNextData);
  }

  if (pathname.startsWith("/suivi-des-indicateurs/")) {
    const allowedTypes = ["ARML", "DREETS", "DDETS"];
    if (!session || !allowedTypes.includes(session.organisation?.type || "")) {
      return NextResponse.redirect(new URL("/suivi-des-indicateurs", request.url));
    }
    return NextResponse.next(requestNextData);
  }

  return NextResponse.next(requestNextData);
}
