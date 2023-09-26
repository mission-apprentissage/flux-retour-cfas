import { CaptureConsole, ExtraErrorData } from "@sentry/integrations";
import * as Sentry from "@sentry/node";

import config from "../../../config";

export function getSentryOptions() {
  return {
    dsn: config.sentry.dsn,
    tracesSampleRate: config.env === "production" ? 0.1 : 1.0,
    tracePropagationTargets: [/\.apprentissage\.beta\.gouv\.fr$/],
    environment: config.env,
    enabled: false, // TODO: remettre `config.env !== "local",` quand l'intégration sera fonctionnelle
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Mongo({ useMongoose: false }),
      new CaptureConsole({ levels: ["error"] }),
      new ExtraErrorData({ depth: 8 }),
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
