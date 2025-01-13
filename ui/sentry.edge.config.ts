// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { captureConsoleIntegration, extraErrorDataIntegration, httpClientIntegration } from "@sentry/integrations";
import { init } from "@sentry/nextjs";

import { publicConfig } from "./config.public";

init({
  dsn: publicConfig.sentry_dsn,
  tracesSampleRate: publicConfig.env === "production" ? 0.01 : 1.0,
  tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/, publicConfig.baseUrl],
  environment: publicConfig.env,
  enabled: publicConfig.env !== "local",
  release: publicConfig.version,
  normalizeDepth: 8,
  integrations: [
    captureConsoleIntegration({ levels: ["error"] }),
    extraErrorDataIntegration({ depth: 8 }),
    httpClientIntegration({}),
  ],
});
