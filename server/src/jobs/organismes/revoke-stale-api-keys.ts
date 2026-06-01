import { revokeStaleApiKeys } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";

const logger = parentLogger.child({
  module: "job:organismes:revoke-stale-api-keys",
});

interface RevokeStaleApiKeysOptions {
  dryRun?: boolean;
  limit?: number;
  months?: number;
}

/**
 * Révoque quotidiennement les clés API des organismes inactifs depuis plus de `months` mois (défaut 12).
 */
export async function revokeStaleApiKeysJob({ dryRun = false, limit, months = 12 }: RevokeStaleApiKeysOptions = {}) {
  logger.info({ dryRun, limit, months }, "Début du job organismes:revoke-stale-api-keys");

  const { revoked, cutoff } = await revokeStaleApiKeys({ months, dryRun, limit });

  logger.info(
    { revoked, dryRun, months, cutoff },
    dryRun ? `${revoked} clé(s) API seraient révoquées (dry-run)` : `${revoked} clé(s) API révoquées pour inactivité`
  );

  return 0;
}
