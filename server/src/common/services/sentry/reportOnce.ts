import { captureException, withScope } from "@sentry/node";

import logger from "@/common/logger";

const reportedConfigurationIssues = new Set<string>();
const degradedDependencies = new Set<string>();

/**
 * Une erreur de configuration ne se répare pas toute seule : la signaler une fois par
 * process suffit. Les gardes qui l'entourent sont appelées à chaque usage du service,
 * d'où des rafales d'événements identiques quand une clé manque.
 */
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

/**
 * Ne capture que le front montant sain → dégradé. Une sonde périodique sur une dépendance
 * en panne produirait sinon un événement par passage — le healthcheck HTTP est interrogé
 * toutes les 10 s sur chaque réplica, soit des centaines d'événements par heure de panne,
 * au moment précis où l'on a besoin de voir clair.
 */
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
