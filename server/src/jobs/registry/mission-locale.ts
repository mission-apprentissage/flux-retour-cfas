import type { CronDef, JobDef } from "job-processor";

import { verifyMissionLocaleEffectifMail } from "../bal/bal.job";
import { hydratePreviousYearMissionLocaleEffectifStatut } from "../hydrate/effectifs/hydrate-effectifs-computed-types";
import {
  backfillIdentifiantNormalise,
  hydrateDailyMissionLocaleStats,
  hydrateMissionLocaleAdresse,
  hydrateMissionLocaleEffectifDateRupture,
  hydrateMissionLocaleOrganisation,
  hydrateMissionLocaleSnapshot,
  hydrateMissionLocaleStats,
  migrateOrphanMlRecordsCrossFamily,
  migrateOrphanMlRecordsDecaToErp,
  softDeleteDoublonEffectifML,
  updateMissionLocaleEffectifActivationDate,
  updateMissionLocaleEffectifCurrentStatus,
  updateMissionLocaleEffectifSnapshot,
  updateMissionLocaleSnapshotFromLastStatus,
  updateNotActivatedMissionLocaleEffectifSnapshot,
} from "../hydrate/mission-locale/hydrate-mission-locale";
import { migrateAutreSituations } from "../migration/migrate-autre-situations";
import { seedMlRdvUrl } from "../tmp/seed-ml-rdv-url";

export const missionLocaleJobs = {
  "hydrate:mission-locale-effectif-snapshot": {
    handler: async (job) => {
      const missionLocaleStructureId = (job.payload?.ml_id as string) ? parseInt(job.payload?.ml_id as string) : null;
      return hydrateMissionLocaleSnapshot(missionLocaleStructureId);
    },
  },
  "hydrate:mission-locale-organisation": {
    handler: async () => {
      return hydrateMissionLocaleOrganisation();
    },
  },
  "hydrate:mission-locale-stats": {
    handler: hydrateMissionLocaleStats,
  },
  "hydrate:mission-locale-effectif-statut": {
    handler: async () => {
      const evaluationDate = new Date();
      await hydratePreviousYearMissionLocaleEffectifStatut(evaluationDate);
    },
  },
  "hydrate:mission-locale-not-activated-effectif": {
    handler: async () => {
      await updateNotActivatedMissionLocaleEffectifSnapshot();
    },
  },
  "hydrate:bal-mails": {
    handler: async () => {
      return verifyMissionLocaleEffectifMail();
    },
  },
  "tmp:mission-locale-snapshot-update": {
    handler: async () => {
      return updateMissionLocaleSnapshotFromLastStatus();
    },
  },
  "tmp:mission-locale-adresse-update": {
    handler: async () => {
      return hydrateMissionLocaleAdresse();
    },
  },
  "tmp:migrate:mission-locale-current-status": {
    handler: async () => {
      return updateMissionLocaleEffectifCurrentStatus();
    },
  },
  "tmp:migrate:mission-locale-effectif-snapshot": {
    handler: async (job) => {
      const jobDate = (job.payload as any)?.date;
      return updateMissionLocaleEffectifSnapshot(jobDate);
    },
  },
  "tmp:migration:ml-date-rupture": {
    handler: async () => {
      return hydrateMissionLocaleEffectifDateRupture();
    },
  },
  "tmp:migration:ml-activation-date": {
    handler: async () => {
      return updateMissionLocaleEffectifActivationDate();
    },
  },
  "tmp:migration:ml-duplication": {
    handler: async () => {
      return softDeleteDoublonEffectifML();
    },
  },
  "tmp:migration:ml-orphan-deca-to-erp": {
    handler: async () => {
      return migrateOrphanMlRecordsDecaToErp();
    },
  },
  "tmp:migration:ml-orphan-cross-family": {
    handler: async () => {
      return migrateOrphanMlRecordsCrossFamily();
    },
  },
  "tmp:migration:ml-identifiant-normalise": {
    handler: async () => {
      return backfillIdentifiantNormalise();
    },
  },
  "tmp:hydrate:timeseries-stats-ml": {
    handler: async () => {
      return hydrateDailyMissionLocaleStats();
    },
  },
  "tmp:migrate:autre-situations": {
    handler: async (job) => {
      const payload = job.payload as { csvPath?: string; dryRun?: boolean } | undefined;
      if (!payload?.csvPath) {
        throw new Error("csvPath est requis");
      }
      return migrateAutreSituations({ csvPath: payload.csvPath, dryRun: payload.dryRun ?? false });
    },
  },
  "tmp:seed-ml-rdv-url": {
    handler: async (job) => {
      const payload = job.payload as { csvPath?: string; dryRun?: boolean } | undefined;
      if (!payload?.csvPath) {
        throw new Error("csvPath est requis");
      }
      return seedMlRdvUrl({ csvPath: payload.csvPath, dryRun: payload.dryRun ?? false });
    },
  },
} satisfies Record<string, JobDef>;

export const missionLocaleCrons = {
  // 04h30 Paris — purge des snapshots ML non activés puis recalcul des statistiques Missions Locales
  "Nettoie et met à jour les statistiques des Missions Locales": {
    cron_string: "30 4 * * *",
    handler: async () => {
      await updateNotActivatedMissionLocaleEffectifSnapshot();
      await hydrateMissionLocaleStats();
    },
  },
} satisfies Record<string, CronDef>;
