import { CaptureConsole, ExtraErrorData } from "@sentry/integrations";
import * as Sentry from "@sentry/node";

import config from "../../../config";

function getSentryOptions() {
  return {
    tracesSampleRate: config.env === "production" ? 0.1 : 1.0,
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/],
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local" && config.env !== "test",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Mongo({ useMongoose: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new CaptureConsole({ levels: ["error"] }) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new ExtraErrorData({ depth: 16 }) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Sentry.Integrations.Anr({ captureStackTrace: true }) as any,
    ],
  };
}

export function initSentryProcessor(): void {
  Sentry.init({
    ...getSentryOptions(),
    tracesSampleRate: 1.0,
  });
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000);
}

export function initSentryExpress(app): void {
  const defaultOptions = getSentryOptions();
  Sentry.init({
    ...defaultOptions,
    integrations: [...defaultOptions.integrations, new Sentry.Integrations.Express({ app })],
  });
}
