import type { ObjectId } from "bson";
import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants/organisme";
import type { ICfaAdoptionStats, StatsPeriod } from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";

import { buildDossierEnvoyeMatch } from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import {
  calculateStartDateAsync,
  createStatWithVariation,
} from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import { findEligibleOrganismes } from "@/common/actions/organismes/deca-cfa-eligibility";
import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";

export interface CfaTerritoire {
  regions?: string[];
  departements?: string[];
}

/**
 * Établissements de formation retenus sur un territoire : présents dans le référentiel et non fermés.
 * Source provisoire de l'estimation du nombre de CFA, en attendant l'arbitrage métier (Carif-Oref, catalogue…).
 */
export const buildCfaTerritoireMatch = ({ regions, departements }: CfaTerritoire = {}) => ({
  est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
  ferme: { $ne: true },
  ...(regions?.length ? { "adresse.region": { $in: regions } } : {}),
  ...(departements?.length ? { "adresse.departement": { $in: departements } } : {}),
});

const countOrganismesWithCollaboration = async (organismeIds: ObjectId[], endExclusive: Date) =>
  organismeIds.length === 0
    ? 0
    : (
        await missionLocaleEffectifsDb().distinct(
          "effectif_snapshot.organisme_id",
          buildDossierEnvoyeMatch(endExclusive, organismeIds)
        )
      ).length;

export async function getCfaAdoptionStats(period: StatsPeriod, regions?: string[]): Promise<ICfaAdoptionStats> {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const organismes = await organismesDb()
    .find(buildCfaTerritoireMatch({ regions }), { projection: { _id: 1, has_account: 1 } })
    .toArray();
  const organismeIds = organismes.map((organisme) => organisme._id);

  const [eligibles, avecCollaboration, avecCollaborationDebut] = await Promise.all([
    organismeIds.length ? findEligibleOrganismes(organismeIds) : Promise.resolve([]),
    countOrganismesWithCollaboration(organismeIds, new Date()),
    countOrganismesWithCollaboration(organismeIds, startDate),
  ]);

  return {
    estimation: organismes.length,
    compatibles: eligibles.length,
    avec_compte: organismes.filter((organisme) => organisme.has_account === true).length,
    avec_collaboration: createStatWithVariation(avecCollaboration, avecCollaborationDebut),
    period,
  };
}
