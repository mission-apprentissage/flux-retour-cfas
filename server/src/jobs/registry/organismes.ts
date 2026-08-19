import { addJob, type CronDef, type JobDef } from "job-processor";

import { hydrateOrganismesOPCOs } from "../hydrate/hydrate-organismes-opcos";
import { hydrateOrganismesEffectifsCount } from "../hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromApiAlternance } from "../hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesFormationsCount } from "../hydrate/organismes/hydrate-organismes-formations";
import { hydrateOrganismesRelations } from "../hydrate/organismes/hydrate-organismes-relations";
import { cleanupOrganismes } from "../hydrate/organismes/organisme-cleanup";
import { createAllMissingOrganismeOrganisation } from "../organisations/organisation.job";
import { revokeStaleApiKeysJob } from "../organismes/revoke-stale-api-keys";

export const organismesJobs = {
  "hydrate:organismes": {
    handler: async (job) => {
      return hydrateOrganismesFromApiAlternance(job.started_at ?? new Date());
    },
  },
  "hydrate:organismes-organisations": {
    handler: async () => {
      return createAllMissingOrganismeOrganisation();
    },
  },
  "hydrate:organismes-relations": {
    handler: async () => {
      return hydrateOrganismesRelations();
    },
  },
  "hydrate:organismes-formations-count": {
    handler: hydrateOrganismesFormationsCount,
  },
  "hydrate:organismes-effectifs-count": {
    handler: async () => {
      return hydrateOrganismesEffectifsCount();
    },
  },
  "hydrate:opcos": {
    handler: async () => {
      return hydrateOrganismesOPCOs();
    },
  },
  "organisme:cleanup": {
    handler: cleanupOrganismes,
  },
  "organismes:revoke-stale-api-keys": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; limit?: number; months?: number } | undefined;
      return revokeStaleApiKeysJob({
        dryRun: payload?.dryRun ?? false,
        limit: payload?.limit,
        months: payload?.months ?? 12,
      });
    },
  },
} satisfies Record<string, JobDef>;

export const organismesCrons = {
  // 03h00 Paris — nettoyage quotidien des organismes obsolètes
  "Cleanup organismes": {
    cron_string: "0 3 * * *",
    handler: cleanupOrganismes,
  },
  // 04h00 Paris — révocation des clés API des organismes inactifs depuis plus de 12 mois
  "Révoque les clés API des organismes inactifs depuis +12 mois, tous les jours à 4h": {
    cron_string: "0 4 * * *",
    handler: async () => {
      await addJob({ name: "organismes:revoke-stale-api-keys", queued: true });
      return 0;
    },
  },
} satisfies Record<string, CronDef>;
