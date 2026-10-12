import type { AlertTier } from "shared/observability/sentryPolicy";

import logger from "@/common/logger";

import { captureTiered, type ErrorKind } from "./alertContract";

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

type DependencyHealthOptions = { tier?: AlertTier; errorKind?: ErrorKind; upstream?: string };

/**
 * Ne capture que le front montant sain → dégradé, et se réarme au retour à la
 * normale. C'est ce qui rend le volume indépendant du débit : une sonde qui
 * passe toutes les 10 s, ou un appel par effectif, produisent le même événement.
 */
export function reportDependencyHealth(
  key: string,
  healthy: boolean,
  cause?: unknown,
  { tier = "oncall", errorKind = "db", upstream }: DependencyHealthOptions = {}
): void {
  if (healthy) {
    degradedDependencies.delete(key);
    return;
  }

  if (degradedDependencies.has(key)) {
    return;
  }
  degradedDependencies.add(key);

  captureTiered(new Error(`Dépendance indisponible : ${key}`, { cause }), {
    tier,
    errorKind,
    upstream,
    fingerprintKey: `dependency-health:${key}`,
  });
}
