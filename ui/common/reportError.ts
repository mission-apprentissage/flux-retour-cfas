import { captureException, withScope } from "@sentry/nextjs";

import { publicConfig } from "@/config.public";

/** Sentry est désactivé en local : sans la console, le développeur ne verrait rien. */
export function reportError(error: unknown, extra?: Record<string, unknown>): void {
  if (publicConfig.env === "local") {
    console.error(error, extra ?? ""); // eslint-disable-line no-console
  }
  captureException(error, extra ? { extra } : undefined);
}

/**
 * Erreur remontée jusqu'à une frontière React : la page a cessé de s'afficher et
 * l'usager voit un écran d'erreur. C'est le seul cas de l'UI qui vaut mieux que
 * le niveau « veille » par défaut.
 */
export function reportBoundaryError(error: unknown, boundary: string): void {
  if (publicConfig.env === "local") {
    console.error(`[${boundary}]`, error); // eslint-disable-line no-console
  }
  withScope((scope) => {
    scope.setTag("alert_tier", "jour");
    scope.setTag("error_kind", "bug");
    scope.setContext("frontière", { boundary });
    captureException(error);
  });
}
