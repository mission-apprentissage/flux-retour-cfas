import { extraErrorDataIntegration } from "@sentry/integrations";
import type { Event } from "@sentry/nextjs";
import {
  BROWSER_DROP_REASONS,
  DENY_URLS,
  ignoreErrorsFor,
  NEXT_DROP_REASONS,
  type DropReason,
} from "shared/observability/sentryNoise";
import { buildBeforeSend, type SentryEventLike } from "shared/observability/sentryPolicy";

import { publicConfig } from "@/config.public";

export type UiRuntime = "next-client" | "next-server" | "next-edge";

/**
 * Le navigateur est le seul runtime concerné par les chunks, le réseau coupé et
 * les extensions. Le contrôle de flux de Next, lui, est levé au rendu, donc
 * aussi bien côté serveur et edge.
 */
const DROP_REASONS: Record<UiRuntime, readonly DropReason[]> = {
  "next-client": [...BROWSER_DROP_REASONS, ...NEXT_DROP_REASONS],
  "next-server": NEXT_DROP_REASONS,
  "next-edge": NEXT_DROP_REASONS,
};

export function buildUiSentryOptions(runtime: UiRuntime) {
  const dropReasons = DROP_REASONS[runtime];
  const applyPolicy = buildBeforeSend<SentryEventLike>({ dropReasons });

  return {
    dsn: publicConfig.sentry_dsn,
    tracesSampleRate: publicConfig.env === "production" ? 0.01 : 1.0,
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/, publicConfig.baseUrl],
    environment: publicConfig.env,
    enabled: publicConfig.env !== "local",
    release: publicConfig.version,
    normalizeDepth: 8,
    initialScope: { tags: { app_runtime: runtime } },
    ignoreErrors: ignoreErrorsFor(dropReasons),
    // Les frames tierces ne concernent que le navigateur.
    ...(runtime === "next-client" ? { denyUrls: [...DENY_URLS] } : {}),
    // SentryEventLike est volontairement plus permissif que Event : le cast est
    // localisé ici, au seul point de contact avec le SDK.
    beforeSend: (event: Event): Event | null => applyPolicy(event as SentryEventLike) as Event | null,
    integrations: [extraErrorDataIntegration({ depth: 8 })],
  };
}
