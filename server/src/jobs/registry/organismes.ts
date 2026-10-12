import { addJob, type CronDef, type JobDef } from "job-processor";

import { hydrateOrganismesOPCOs } from "../hydrate/hydrate-organismes-opcos";
import { hydrateOrganismesEffectifsCount } from "../hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromApiAlternance } from "../hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesFormationsCount } from "../hydrate/organismes/hydrate-organismes-formations";
import { hydrateOrganismesRelations } from "../hydrate/organismes/hydrate-organismes-relations";
import { cleanupOrganismes } from "../hydrate/organismes/organisme-cleanup";
import { createAllMissingOrganismeOrganisation, hydrateOrganismesHasAccount } from "../organisations/organisation.job";
import { collabInactiviteCfaJob } from "../organismes/collab-inactivite-cfa";
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
  "hydrate:organismes-has-account": {
    handler: async () => {
      return hydrateOrganismesHasAccount();
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
  "collab:inactivite-cfa": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; limit?: number } | undefined;
      return collabInactiviteCfaJob({ dryRun: payload?.dryRun ?? false, limit: payload?.limit });
    },
  },
} satisfies Record<string, JobDef>;

export const organismesCrons = {
  // 04h35 Paris — nettoyage quotidien des organismes obsolètes.
  // Déplacé de 03h00 : il attendait 78 min derrière la file du batch de 02h30.
  // Mesuré sur 90 j : durée max 4 s.
  "Cleanup organismes": {
    cron_string: "35 4 * * *",
    checkinMargin: 15,
    maxRuntimeInMinutes: 5,
    handler: cleanupOrganismes,
  },
  // 04h00 Paris — révocation des clés API des organismes inactifs depuis plus de 12 mois.
  // Seul cron qui reste dans la file du batch de 02h30 : son heure figure dans son nom,
  // qui sert d'identifiant en base et de slug de monitor, donc il n'est pas déplaçable.
  // Mesuré sur 90 j : attente max 31 min, durée max 0,1 s.
  "Révoque les clés API des organismes inactifs depuis +12 mois, tous les jours à 4h": {
    cron_string: "0 4 * * *",
    checkinMargin: 45,
    maxRuntimeInMinutes: 5,
    handler: async () => {
      await addJob({ name: "organismes:revoke-stale-api-keys", queued: true });
      return 0;
    },
  },
  // 07h00 Paris — relance puis suspension de la collaboration des CFA inactifs.
  // "Relance et suspension de la collaboration des CFA inactifs, tous les jours à 7h": {
  //   cron_string: "0 7 * * *",
  //   handler: async () => {
  //     await addJob({ name: "collab:inactivite-cfa", queued: true });
  //     return 0;
  //   },
  // },
} satisfies Record<string, CronDef>;
