import { captureException, withScope } from "@sentry/node";

import logger from "@/common/logger";

const reportedConfigurationIssues = new Set<string>();
const degradedDependencies = new Set<string>();

/** Les gardes de configuration sont évaluées à chaque appel du service : une fois suffit. */
export function reportConfigurationIssueOnce(key: string, message: string): void {
  if (reportedConfigurationIssues.has(key)) {
    return;
  }
  reportedConfigurationIssues.add(key);

  logger.error({ key }, message);
  withScope((scope) => {
    scope.setTag("error_kind", "config");
    scope.setFingerprint(["configuration", key]);
    captureException(new Error(message));
  });
}

/** Ne capture que le front montant sain → dégradé : la sonde passe toutes les 10 s. */
export function reportDependencyHealth(key: string, healthy: boolean, cause?: unknown): void {
  if (healthy) {
    degradedDependencies.delete(key);
    return;
  }

  if (degradedDependencies.has(key)) {
    return;
  }
  degradedDependencies.add(key);

  withScope((scope) => {
    scope.setTag("error_kind", "db");
    scope.setFingerprint(["dependency-health", key]);
    captureException(new Error(`Dépendance indisponible : ${key}`, { cause }));
  });
}
