import { ObjectId } from "bson";
import { ML_ALERTE_SEUILS, type IMlAlerte, type IMlFicheIndicateurs } from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay, subtractDaysUTC } from "shared/utils/date";

import { missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";

import { getSegmentStatsForPeriod } from "./mission-locale-stats.actions";
import { ENGAGEMENT_THRESHOLD } from "./mission-locale-stats.helpers";

async function getComptesStats(missionLocaleId: ObjectId) {
  const [result] = await usersMigrationDb()
    .aggregate<{ premier_compte_at: Date | null; derniere_connexion_at: Date | null }>([
      { $match: { organisation_id: missionLocaleId, account_status: "CONFIRMED" } },
      {
        $group: {
          _id: null,
          premier_compte_at: { $min: { $ifNull: ["$confirmed_at", "$created_at"] } },
          derniere_connexion_at: { $max: "$last_connection" },
        },
      },
    ])
    .toArray();

  return {
    premier_compte_at: result?.premier_compte_at ?? null,
    derniere_connexion_at: result?.derniere_connexion_at ?? null,
  };
}

export async function getMissionLocaleFicheIndicateurs(
  missionLocaleId: ObjectId,
  now: Date = new Date()
): Promise<IMlFicheIndicateurs> {
  const evaluationDate = normalizeToUTCDay(now);

  const [ml, comptes, all, collab, collabsRecues] = await Promise.all([
    organisationsDb().findOne({ _id: missionLocaleId, type: "MISSION_LOCALE" }, { projection: { activated_at: 1 } }),
    getComptesStats(missionLocaleId),
    getSegmentStatsForPeriod(evaluationDate, [missionLocaleId], "all"),
    getSegmentStatsForPeriod(evaluationDate, [missionLocaleId], "collab"),
    missionLocaleEffectifsDb().countDocuments({
      mission_locale_id: missionLocaleId,
      "organisme_data.acc_conjoint": true,
      "organisme_data.acc_conjoint_at": { $lte: now },
      soft_deleted: { $ne: true },
    }),
  ]);

  const isActivated = Boolean((ml as { activated_at?: Date | null } | null)?.activated_at);
  const tauxTraitement = all.total > 0 ? all.traite / all.total : null;
  const isEngaged = isActivated && tauxTraitement !== null && tauxTraitement >= ENGAGEMENT_THRESHOLD;
  const delaiCollab =
    collab.delai_premiere_activite_count > 0
      ? Math.round((collab.delai_premiere_activite_jours_total / collab.delai_premiere_activite_count) * 10) / 10
      : null;
  const limiteInactivite = subtractDaysUTC(now, ML_ALERTE_SEUILS.inactivite_jours);

  const alertes: IMlAlerte[] = [];
  if (delaiCollab !== null && delaiCollab > ML_ALERTE_SEUILS.delai_collab_jours) {
    alertes.push({ type: "delai_collab", valeur: delaiCollab });
  }
  if (all.a_recontacter > ML_ALERTE_SEUILS.a_recontacter) {
    alertes.push({ type: "a_recontacter", valeur: all.a_recontacter });
  }
  if (!isActivated && collabsRecues > 0) {
    alertes.push({ type: "collab_sans_compte", valeur: collabsRecues });
  }
  if (isActivated && !isEngaged) {
    alertes.push({ type: "non_engagee", valeur: tauxTraitement === null ? null : Math.round(tauxTraitement * 100) });
  }
  if (isActivated && (!comptes.derniere_connexion_at || comptes.derniere_connexion_at < limiteInactivite)) {
    alertes.push({ type: "inactive", valeur: null });
  }

  return {
    ...comptes,
    taux_traitement: tauxTraitement === null ? null : Math.round(tauxTraitement * 100),
    is_engaged: isEngaged,
    alertes,
  };
}
