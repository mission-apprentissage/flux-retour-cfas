import { CaptureConsole, ExtraErrorData } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import type { Integration } from "@sentry/types";

import config from "../../../config";

function getSentryOptions(extraIntegrations: Integration[]): Sentry.NodeOptions {
  return {
    tracesSampler: (samplingContext) => {
      if (samplingContext.transactionContext?.op === "queue.item") {
        // We want to sample the process effectif transaction at a rate of 1/1_000
        return 1 / 1_000;
      }

      if (samplingContext.transactionContext?.op === "deca.item") {
        // We want to sample the process effectif transaction at a rate of 1/1_000
        return 1 / 1_000;
      }

      // Continue trace decision, if there is any parentSampled information
      if (samplingContext.parentSampled != null) {
        return samplingContext.parentSampled;
      }

      if (samplingContext.transactionContext?.op === "processor.job") {
        // Sample 100% of processor jobs
        return 1.0;
      }

      return 0.01;
    },
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
      ...extraIntegrations,
    ],
  };
}

export function initSentryProcessor(): void {
  Sentry.init(getSentryOptions([]));
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000);
}

export function initSentryExpress(app): void {
  Sentry.init(getSentryOptions([new Sentry.Integrations.Express({ app })]));
}
