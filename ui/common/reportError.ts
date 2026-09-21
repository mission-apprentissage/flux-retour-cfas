import { captureException } from "@sentry/nextjs";

import { publicConfig } from "@/config.public";

/** Sentry est désactivé en local : sans la console, le développeur ne verrait rien. */
export function reportError(error: unknown, extra?: Record<string, unknown>): void {
  if (publicConfig.env === "local") {
    console.error(error, extra ?? ""); // eslint-disable-line no-console
  }
  captureException(error, extra ? { extra } : undefined);
}
