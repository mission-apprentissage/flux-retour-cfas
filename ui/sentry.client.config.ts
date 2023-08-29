// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { ExtraErrorData, HttpClient, ReportingObserver } from "@sentry/integrations";
import * as Sentry from "@sentry/nextjs";

import { publicConfig } from "./config.public";

Sentry.init({
  dsn: publicConfig.sentry_dsn,
  tracesSampleRate: publicConfig.env === "production" ? 0.1 : 1.0,
  tracePropagationTargets: [/\.apprentissage\.beta\.gouv\.fr$/],
  environment: publicConfig.env,
  enabled: publicConfig.env !== "local",
  // debug: true,
  normalizeDepth: 8,
  // replaysOnErrorSampleRate: 1.0,
  // replaysSessionSampleRate: 0.1,
  integrations: [
    // new Sentry.Replay({
    //   maskAllText: true,
    //   blockAllMedia: true,
    // }),
    // @ts-ignore
    new ExtraErrorData({ depth: 8 }),
    // @ts-ignore
    new HttpClient({}),
    // @ts-ignore
    new ReportingObserver({ types: ["crash", "deprecation", "intervention"] }),
  ],
});
