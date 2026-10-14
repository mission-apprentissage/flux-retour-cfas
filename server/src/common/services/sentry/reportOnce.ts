import type { AlertTier } from "shared/observability/sentryPolicy";

import logger from "@/common/logger";

import { captureTiered, type ErrorKind } from "./alertContract";

const reportedConfigurationIssues = new Set<string>();
const incidents = new Map<string, { lastFailureAt: number; recovered: boolean }>();

const RECOVERY_QUIET_MS = 15 * 60_000;

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
 * Une capture par incident, quel que soit le débit. Un échec n'ouvre un nouvel
 * incident que si un succès a été vu depuis le précédent **et** qu'il date de
 * plus de RECOVERY_QUIET_MS : sous des appels concurrents, une panne
 * intermittente alterne succès et échecs, et un succès isolé ne prouve pas le
 * retour à la normale. L'évaluation à l'échec, et non au succès, garde une sonde
 * lente (heartbeat toutes les 15 min) capable de signaler un second incident.
 */
export function reportDependencyHealth(
  key: string,
  healthy: boolean,
  cause?: unknown,
  { tier = "oncall", errorKind = "db", upstream }: DependencyHealthOptions = {}
): void {
  const now = Date.now();
  const incident = incidents.get(key);

  if (healthy) {
    if (incident) incident.recovered = true;
    return;
  }

  const ongoing = incident && !(incident.recovered && now - incident.lastFailureAt >= RECOVERY_QUIET_MS);
  incidents.set(key, { lastFailureAt: now, recovered: false });
  if (ongoing) {
    return;
  }

  captureTiered(new Error(`Dépendance indisponible : ${key}`, { cause }), {
    tier,
    errorKind,
    upstream,
    fingerprintKey: `dependency-health:${key}`,
  });
}
