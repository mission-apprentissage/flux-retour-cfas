import type { CronDef, JobDef } from "job-processor";

import { effectifsDb } from "@/common/model/collections";

import { verifyMissionLocaleEffectifMail } from "../bal/bal.job";
import { hydrateCommunesVoies } from "../hydrate/communes-voies/hydrate-communes-voies";
import {
  hydrateEffectifsComputedTypes,
  hydratePreviousYearMissionLocaleEffectifStatut,
} from "../hydrate/effectifs/hydrate-effectifs-computed-types";
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
import { backfillMlSuiviDates } from "../migration/backfill-ml-suivi-dates";
import { clotureMlARecontacter } from "../migration/cloture-ml-a-recontacter";
import { migrateAutreSituations } from "../migration/migrate-autre-situations";
import { migrateCommuneApprenant } from "../migration/migrate-commune-apprenant";
import { seedMlRdvUrl } from "../tmp/seed-ml-rdv-url";

import { payloadDate } from "./payload";

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
  "tmp:migrate:statuts-then-ml-current-status": {
    handler: async (_job, signal) => {
      const statuts = await hydrateEffectifsComputedTypes({ touchUpdatedAt: false }, effectifsDb, signal);
      if (statuts.aborted) {
        throw signal.reason;
      }
      if (statuts.error) {
        throw statuts.error;
      }

      const currentStatus = await updateMissionLocaleEffectifCurrentStatus(signal);
      if (currentStatus.aborted) {
        throw signal.reason;
      }

      return { statuts, currentStatus };
    },
    resumable: true,
  },
  "tmp:migrate:mission-locale-current-status": {
    handler: async () => {
      return updateMissionLocaleEffectifCurrentStatus();
    },
  },
  "tmp:migrate:ml-suivi-dates": {
    handler: async () => {
      return backfillMlSuiviDates();
    },
  },
  "tmp:migrate:mission-locale-effectif-snapshot": {
    handler: async (job) => {
      const jobDate = payloadDate(job.payload, "date");
      if (!jobDate) {
        throw new Error('Paramètre "date" manquant');
      }
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
  "hydrate:daily-mission-locale-stats": {
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
  "tmp:migrate:ml-cloture-a-recontacter": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean } | undefined;
      return clotureMlARecontacter({ dryRun: payload?.dryRun ?? false });
    },
  },
  "tmp:migrate:commune-apprenant": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; limit?: number } | undefined;
      const { rapport } = await migrateCommuneApprenant({ dryRun: payload?.dryRun ?? false, limit: payload?.limit });
      return rapport;
    },
  },
  "tmp:migrate:communes-voies-puis-commune-apprenant": {
    handler: async () => {
      const communesVoies = await hydrateCommunesVoies();
      const { rapport } = await migrateCommuneApprenant({ dryRun: false });
      return { communesVoies, rapport };
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
  // 05h45 Paris — purge des snapshots ML non activés puis recalcul des statistiques Missions Locales.
  // Déplacé de 04h30 pour passer après les statuts d'effectifs du samedi, qui finissent
  // au plus tard à 05h36. Mesuré sur 90 j : durée max 30 min.
  "Nettoie et met à jour les statistiques des Missions Locales": {
    cron_string: "45 5 * * *",
    checkinMargin: 15,
    maxRuntimeInMinutes: 65,
    handler: async () => {
      await updateNotActivatedMissionLocaleEffectifSnapshot();
      await hydrateMissionLocaleStats();
    },
  },
} satisfies Record<string, CronDef>;
