import { ObjectId } from "mongodb";
import { IOrganisationMissionLocale } from "shared/models";
import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import { findEligibleOrganismes } from "../organismes/deca-cfa-eligibility";

import { missionLocaleBaseAggregation } from "./mission-locale.actions";

/**
 * Une ligne brute issue de l'agrégation : un CFA chez qui la ML a des jeunes en rupture.
 */
interface CfaAggRow {
  organisme_id: ObjectId;
  nb_jeunes_rupture: number;
  ml_beta_activated_at?: Date | null;
  organisme: {
    siret?: string | null;
    uai?: string | null;
    nom?: string | null;
    raison_sociale?: string | null;
    enseigne?: string | null;
    adresse?: { complete?: string | null; code_postal?: string | null; commune?: string | null } | null;
    contacts_from_referentiel?: Array<{ email?: string | null }> | null;
  };
  invited_by_me: boolean;
}

const formatAdresse = (adresse?: CfaAggRow["organisme"]["adresse"]): string | null => {
  if (!adresse) return null;
  if (adresse.complete) return adresse.complete;
  const parts = [adresse.code_postal, adresse.commune].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
};

/**
 * Liste des CFA du territoire d'une Mission Locale (ceux où des jeunes rattachés à cette ML
 * sont en rupture), triés par volume de jeunes décroissant, avec un statut d'invitation
 * relatif au conseiller connecté.
 *
 * Réutilise `missionLocaleBaseAggregation` pour que le décompte de jeunes en rupture soit
 * cohérent avec ce que la ML voit dans son tableau de bord.
 */
export async function getCfaListToInviteForMissionLocale(
  missionLocale: IOrganisationMissionLocale,
  userId: ObjectId
): Promise<ICfaToInvite[]> {
  const missionLocaleId = new ObjectId(missionLocale._id);

  const baseAggregation = await missionLocaleBaseAggregation(missionLocale);

  const rows = (await missionLocaleEffectifsDb()
    .aggregate([
      ...baseAggregation,
      {
        $group: {
          _id: "$effectif_snapshot.organisme_id",
          nb_jeunes_rupture: { $sum: 1 },
          ml_beta_activated_at: { $first: "$computed.organisme.ml_beta_activated_at" },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "_id",
          foreignField: "_id",
          as: "organisme",
        },
      },
      { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "missionLocaleCfaInvitations",
          let: { orgId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$mission_locale_id", missionLocaleId] },
                    { $eq: ["$author_id", userId] },
                    { $eq: ["$organisme_id", "$$orgId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
            { $project: { _id: 1 } },
          ],
          as: "_my_invitation",
        },
      },
      {
        $project: {
          _id: 0,
          organisme_id: "$_id",
          nb_jeunes_rupture: 1,
          ml_beta_activated_at: 1,
          organisme: {
            siret: "$organisme.siret",
            uai: "$organisme.uai",
            nom: "$organisme.nom",
            raison_sociale: "$organisme.raison_sociale",
            enseigne: "$organisme.enseigne",
            adresse: "$organisme.adresse",
            contacts_from_referentiel: "$organisme.contacts_from_referentiel",
          },
          invited_by_me: { $gt: [{ $size: "$_my_invitation" }, 0] },
        },
      },
    ])
    .toArray()) as CfaAggRow[];

  // Ensemble des organismes éligibles techniquement à la collaboration (un seul appel global).
  const eligibleIds = new Set((await findEligibleOrganismes()).map((o) => o._id.toString()));

  const computeStatut = (row: CfaAggRow): CFA_INVITATION_STATUT => {
    if (row.ml_beta_activated_at) {
      return CFA_INVITATION_STATUT.CFA_ACTIF;
    }
    if (row.invited_by_me) {
      return CFA_INVITATION_STATUT.INVITATION_ENVOYEE;
    }
    const hasEmail = (row.organisme.contacts_from_referentiel ?? []).some((c) => Boolean(c?.email));
    const isEligible = eligibleIds.has(row.organisme_id.toString());
    return hasEmail && isEligible ? CFA_INVITATION_STATUT.INVITER : CFA_INVITATION_STATUT.BIENTOT_DISPONIBLE;
  };

  return rows
    .map((row) => ({
      organisme_id: row.organisme_id.toString(),
      siret: row.organisme.siret ?? null,
      uai: row.organisme.uai ?? null,
      nom: row.organisme.nom ?? row.organisme.raison_sociale ?? row.organisme.enseigne ?? null,
      adresse: formatAdresse(row.organisme.adresse),
      nb_jeunes_rupture: row.nb_jeunes_rupture,
      statut: computeStatut(row),
    }))
    .sort((a, b) => b.nb_jeunes_rupture - a.nb_jeunes_rupture || (a.nom ?? "").localeCompare(b.nom ?? ""));
}
