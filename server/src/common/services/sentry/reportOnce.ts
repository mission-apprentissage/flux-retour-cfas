import logger from "@/common/logger";

import { captureTiered } from "./alertContract";

const reportedConfigurationIssues = new Set<string>();
const degradedDependencies = new Set<string>();

/** Les gardes de configuration sont évaluées à chaque appel du service : une fois suffit. */
export function reportConfigurationIssueOnce(key: string, message: string): void {
  if (reportedConfigurationIssues.has(key)) {
    return;
  }
  reportedConfigurationIssues.add(key);

  logger.error({ key }, message);
  captureTiered(new Error(message), {
    tier: "jour",
    errorKind: "config",
    fingerprintKey: `configuration:${key}`,
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

  captureTiered(new Error(`Dépendance indisponible : ${key}`, { cause }), {
    // Une dépendance injoignable rend le service inutilisable pour tout le monde.
    tier: "oncall",
    errorKind: "db",
    fingerprintKey: `dependency-health:${key}`,
  });
}
