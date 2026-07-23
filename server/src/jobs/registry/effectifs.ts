import type { CronDef, JobDef } from "job-processor";
import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate, subtractDaysUTC } from "shared/utils";

import { scoreExistingEffectifs } from "../classifier/score-effectifs";
import { updateComputedFields } from "../computed/update-computed";
import {
  hydrateEffectifsComputedTypesGenerique,
  hydratePreviousYearMissionLocaleEffectifStatut,
} from "../hydrate/effectifs/hydrate-effectifs-computed-types";
import { hydrateEffectifsFormationsNiveaux } from "../hydrate/effectifs/hydrate-effectifs-formations-niveaux";
import { hydrateWeeklyEffectifStatut } from "../hydrate/effectifs/hydrate-effectifs-statut";
import {
  hydrateEffectifsLieuDeFormation,
  hydrateEffectifsLieuDeFormationVersOrganismeFormateur,
} from "../hydrate/effectifs/update-effectifs-lieu-de-formation";
import { hydrateInscritSansContrat } from "../hydrate/france-travail/hydrate-france-travail";

export const effectifsJobs = {
  "hydrate:effectifs:update_all_computed_statut": {
    handler: async (job, signal) => {
      const organismeId = (job.payload?.id as string) ? new ObjectId(job.payload?.id as string) : null;
      return hydrateEffectifsComputedTypesGenerique(
        organismeId ? { query: { organisme_id: organismeId } } : undefined,
        signal
      );
    },
    resumable: true,
  },
  "hydrate:effectifs:update_computed_statut": {
    handler: async (job, signal) => {
      const organismeId = (job.payload?.id as string) ? new ObjectId(job.payload?.id as string) : null;
      const evaluationDate = new Date();
      return hydrateEffectifsComputedTypesGenerique(
        {
          query: {
            annee_scolaire: { $in: getAnneesScolaireListFromDate(evaluationDate) },
            updated_at: { $lt: subtractDaysUTC(evaluationDate, 7) },
            ...(organismeId ? { organisme_id: organismeId } : {}),
          },
        },
        signal
      );
    },
    resumable: true,
  },
  "hydrate:effectifs-formation-niveaux": {
    handler: async () => {
      return hydrateEffectifsFormationsNiveaux();
    },
  },
  "hydrate:update-effectifs-lieu-de-formation": {
    handler: async () => {
      return hydrateEffectifsLieuDeFormation();
    },
  },
  "hydrate:update-effectifs-organisme-lieu-vers-formateur": {
    handler: async () => {
      return hydrateEffectifsLieuDeFormationVersOrganismeFormateur();
    },
  },
  "computed:update": {
    handler: updateComputedFields,
  },
  "classifier:score-effectifs": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; limit?: number } | undefined;
      return scoreExistingEffectifs({ dryRun: payload?.dryRun ?? false, limit: payload?.limit });
    },
  },
  "tmp:hydrate:inscrit-sans-contrat": {
    handler: async () => {
      return hydrateInscritSansContrat();
    },
  },
} satisfies Record<string, JobDef>;

export const effectifsCrons = {
  // 05h00 Paris le samedi — recalcul hebdomadaire des statuts d'effectifs (année courante + N-1 côté ML)
  "Mettre à jour les statuts d'effectifs tous les samedis matin à 5h": {
    cron_string: "0 5 * * 6",
    handler: async (signal) => {
      const evaluationDate = new Date();
      await hydrateWeeklyEffectifStatut(signal, evaluationDate);
      await hydratePreviousYearMissionLocaleEffectifStatut(evaluationDate, signal);
    },
    resumable: true,
  },
} satisfies Record<string, CronDef>;
