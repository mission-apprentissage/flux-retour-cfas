// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { ExtraErrorData, HttpClient } from "@sentry/integrations";
import * as Sentry from "@sentry/nextjs";

import { publicConfig } from "./config.public";

Sentry.init({
  dsn: publicConfig.sentry.dsn,
  tracesSampleRate: publicConfig.env === "production" ? 0.1 : 1.0,
  tracePropagationTargets: [/\.apprentissage\.beta\.gouv\.fr$/],
  environment: publicConfig.env,
  enabled: publicConfig.env !== "local",
  // debug: true,
  normalizeDepth: 8,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    // @ts-ignore
    new ExtraErrorData({ depth: 8 }),
    // @ts-ignore
    new HttpClient({}),
  ],
});
