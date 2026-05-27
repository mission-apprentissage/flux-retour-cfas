import { STATUT_APPRENANT } from "shared/constants";
import { getAnneeScolaireListFromDateRange } from "shared/utils";

import {
  buildEffRuptureAgeFilter,
  createDernierStatutFieldPipeline,
  DATE_START_RUPTURES,
} from "@/common/actions/shared/rupture-pipeline.utils";
import { missionLocaleEffectifsDb, usersMigrationDb } from "@/common/model/collections";

/**
 * Service de la route `/api/v1/onboarding/connexion-info` (mode invitation
 * enrichi de la page de connexion). Pour un email donné, retourne les infos
 * de son OF (si type OF) + toutes les Missions Locales suivant ses jeunes en
 * rupture. Pour les autres typologies (ML, ARML, …), retourne juste l'email
 * — l'UI affiche le formulaire de connexion sans la card OF.
 *
 * Renvoie `null` uniquement si l'email n'existe pas en DB.
 */

export type ConnexionInvitationAdresse = {
  rue: string | null;
  code_postal: string | null;
  commune: string | null;
} | null;

export type ConnexionInvitationOrganismeInfo = {
  nom: string | null;
  adresse: ConnexionInvitationAdresse;
  uai: string | null;
  siret: string;
};

export type ConnexionInvitationMissionLocale = {
  nom: string | null;
  adresse: ConnexionInvitationAdresse;
  effectifs_count: number;
};

export type ConnexionInvitationInfo = {
  email: string;
  organisme: ConnexionInvitationOrganismeInfo | null;
  missionsLocales: ConnexionInvitationMissionLocale[];
};

// Rue reconstruite à partir de `numero + voie` plutôt que `complete` pour
// éviter de dupliquer code postal et commune côté rendu (`formatAdresseLong`).
const mapAdresseToFrontend = (raw: Record<string, unknown> | null | undefined): ConnexionInvitationAdresse => {
  if (!raw) return null;
  const numero = raw.numero != null ? String(raw.numero) : "";
  const voie = typeof raw.voie === "string" ? raw.voie : "";
  const rue = [numero, voie].filter(Boolean).join(" ").trim() || null;
  return {
    rue,
    code_postal: typeof raw.code_postal === "string" ? raw.code_postal : null,
    commune: typeof raw.commune === "string" ? raw.commune : null,
  };
};

export const getConnexionInvitationInfoByEmail = async (email: string): Promise<ConnexionInvitationInfo | null> => {
  const userResult = (await usersMigrationDb()
    .aggregate([
      { $match: { email } },
      {
        $lookup: {
          from: "organisations",
          localField: "organisation_id",
          foreignField: "_id",
          as: "organisation",
        },
      },
      { $unwind: "$organisation" },
      {
        $lookup: {
          from: "organismes",
          let: { siret: "$organisation.siret", uai: "$organisation.uai" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }] },
              },
            },
            { $project: { _id: 1, nom: 1, raison_sociale: 1, adresse: 1 } },
          ],
          as: "organisme",
        },
      },
      { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          email: 1,
          organisation_uai: "$organisation.uai",
          organisation_siret: "$organisation.siret",
          organisme_id: "$organisme._id",
          organisme_nom: { $ifNull: ["$organisme.nom", "$organisme.raison_sociale"] },
          organisme_adresse: "$organisme.adresse",
        },
      },
    ])
    .next()) as {
    email: string;
    organisation_uai: string | null;
    organisation_siret: string | null;
    organisme_id?: import("bson").ObjectId;
    organisme_nom?: string | null;
    organisme_adresse?: Record<string, unknown> | null;
  } | null;

  if (!userResult) {
    return null;
  }

  // Mêmes filtres "en rupture" que `tba-contacts.ts` /
  // `cfa-effectifs-ruptures.actions.ts`. Différence : ici on remonte TOUTES
  // les ML (pas top 2) avec leur adresse.
  let missionsLocales: ConnexionInvitationMissionLocale[] = [];
  if (userResult.organisme_id) {
    type RawMlRow = { nom: string | null; adresse: Record<string, unknown> | null; effectifs_count: number };
    const rawMls = (await missionLocaleEffectifsDb()
      .aggregate([
        { $match: { "effectif_snapshot.organisme_id": userResult.organisme_id } },
        ...buildEffRuptureAgeFilter(),
        {
          $match: {
            "effectif_snapshot.annee_scolaire": {
              $in: getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date()),
            },
          },
        },
        {
          $addFields: {
            date_rupture: { $ifNull: ["$date_rupture", "$cfa_rupture_declaration.date_rupture"] },
          },
        },
        ...createDernierStatutFieldPipeline(),
        {
          $match: {
            $or: [
              {
                "effectif_snapshot._computed.statut.en_cours": STATUT_APPRENANT.RUPTURANT,
                date_rupture: { $lte: new Date() },
              },
              { cfa_rupture_declaration: { $exists: true } },
            ],
          },
        },
        { $match: { dernierStatutDureeInDay: { $lte: 180 } } },
        {
          $match: {
            $or: [
              { cfa_rupture_declaration: { $exists: true } },
              { "current_status.value": { $ne: STATUT_APPRENANT.APPRENTI } },
            ],
          },
        },
        { $group: { _id: "$mission_locale_id", effectifs_count: { $sum: 1 } } },
        {
          $lookup: {
            from: "organisations",
            let: { mlId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$mlId"] } } },
              { $project: { _id: 1, nom: 1, adresse: 1 } },
            ],
            as: "ml_info",
          },
        },
        { $unwind: { path: "$ml_info", preserveNullAndEmptyArrays: true } },
        // Nom alphabétique en secondaire → ordre stable entre 2 requêtes.
        { $sort: { effectifs_count: -1, "ml_info.nom": 1 } },
        {
          $project: {
            _id: 0,
            nom: "$ml_info.nom",
            adresse: "$ml_info.adresse",
            effectifs_count: 1,
          },
        },
      ])
      .toArray()) as RawMlRow[];

    missionsLocales = rawMls.map((row) => ({
      nom: row.nom,
      adresse: mapAdresseToFrontend(row.adresse),
      effectifs_count: row.effectifs_count,
    }));
  }

  return {
    email: userResult.email,
    // Un match `organismes` n'est possible que si (siret, uai) sont définis,
    // donc `siret` est forcément présent quand `organisme_id` l'est.
    organisme:
      userResult.organisme_id && userResult.organisation_siret
        ? {
            nom: userResult.organisme_nom ?? null,
            adresse: mapAdresseToFrontend(userResult.organisme_adresse),
            uai: userResult.organisation_uai ?? null,
            siret: userResult.organisation_siret,
          }
        : null,
    missionsLocales,
  };
};
