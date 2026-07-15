import { ObjectId } from "bson";
import { IOrganisationOrganismeFormation } from "shared/models";
import { SITUATION_LABEL_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import {
  CFA_SUIVI_CATEGORY,
  CfaSuiviCategory,
  ICfaEffectif,
  ICfaSuiviMissionLocaleResponse,
} from "shared/models/routes/organismes/cfa";
import { getAnneeScolaireListFromDateRange } from "shared/utils";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import {
  DATE_START_RUPTURES,
  buildCollabStatusOrderField,
  buildCollabStatusSwitch,
  buildContactedByMlExpr,
  buildCsvInConditions,
  buildDistinctFacet,
  buildEffRuptureAgeFilter,
  buildNameSearchConditions,
} from "../shared/rupture-pipeline.utils";

export interface CfaSuiviMissionLocaleQueryParams {
  category: CfaSuiviCategory;
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
  collab_status?: string;
  formation?: string;
}

function getSuiviSortField(sort: string): string {
  switch (sort) {
    case "nom":
      return "_nom";
    case "formation":
      return "_libelle_formation";
    case "collab_status":
      return "collab_status_order";
    case "date_rupture":
    default:
      return "date_rupture";
  }
}

/**
 * Étapes communes : sélection des dossiers missionLocaleEffectif d'un CFA + champs calculés
 * permettant de distinguer collab (acc_conjoint) et hors-collab contacté (transmis auto + situation ML).
 */
function buildSuiviBasePipeline(
  organisation: IOrganisationOrganismeFormation,
  isAllowedDeca: boolean
): Record<string, unknown>[] {
  if (!organisation.organisme_id) {
    throw new Error("organisme_id is required");
  }
  const organismeId = new ObjectId(organisation.organisme_id);

  const now = new Date();
  const plus25Cutoff = new Date(new Date(now).setFullYear(now.getFullYear() - 25));
  const moins16Cutoff = new Date(new Date(now).setFullYear(now.getFullYear() - 16));

  const stages: Record<string, unknown>[] = [{ $match: { "effectif_snapshot.organisme_id": organismeId } }];

  if (!isAllowedDeca) {
    stages.push({ $match: { "effectif_snapshot.is_deca_compatible": { $exists: false } } });
  }

  stages.push(
    {
      $match: {
        "effectif_snapshot.annee_scolaire": {
          $in: getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, now),
        },
      },
    },
    ...buildEffRuptureAgeFilter(),
    {
      $addFields: {
        date_rupture: { $ifNull: ["$date_rupture", "$cfa_rupture_declaration.date_rupture"] },
      },
    },
    {
      $addFields: {
        _nom: { $ifNull: ["$identifiant_normalise.nom", "$effectif_snapshot.apprenant.nom"] },
        _prenom: { $ifNull: ["$identifiant_normalise.prenom", "$effectif_snapshot.apprenant.prenom"] },
        _libelle_formation: "$effectif_snapshot.formation.libelle_long",
        collab_status: buildCollabStatusSwitch(),
        // Onglet 1 : collaboration initiée par le CFA.
        is_collab: { $eq: ["$organisme_data.acc_conjoint", true] },
        // Onglet 2 : jeune réellement contacté par la ML hors collaboration (joint OU préqualif WhatsApp).
        is_hors_collab_contacted: {
          $and: [{ $ne: ["$organisme_data.acc_conjoint", true] }, buildContactedByMlExpr()],
        },
        is_plus_25: {
          $and: [
            { $lt: ["$effectif_snapshot.apprenant.date_de_naissance", plus25Cutoff] },
            { $ne: [{ $ifNull: ["$effectif_snapshot.apprenant.rqth", false] }, true] },
          ],
        },
        is_moins_16: { $gt: ["$effectif_snapshot.apprenant.date_de_naissance", moins16Cutoff] },
      },
    },
    { $addFields: { collab_status_order: buildCollabStatusOrderField() } },
    // Univers "Tous" : uniquement les jeunes contactés (collab OU hors-collab contacté), jamais les non-contactés.
    { $match: { $or: [{ is_collab: true }, { is_hors_collab_contacted: true }] } }
  );

  return stages;
}

function buildSuiviUserFilterStages(params: {
  search?: string;
  collab_status?: string;
  formation?: string;
}): Record<string, unknown>[] {
  const filterConditions: Record<string, unknown>[] = [
    ...buildNameSearchConditions(params.search, "_nom", "_prenom"),
    ...buildCsvInConditions("collab_status", params.collab_status),
    ...buildCsvInConditions("_libelle_formation", params.formation),
  ];
  return filterConditions.length > 0 ? [{ $match: { $and: filterConditions } }] : [];
}

function categoryMatchStage(category: CfaSuiviCategory): Record<string, unknown>[] {
  switch (category) {
    case CFA_SUIVI_CATEGORY.COLLAB:
      return [{ $match: { is_collab: true } }];
    case CFA_SUIVI_CATEGORY.HORS_COLLAB:
      return [{ $match: { is_hors_collab_contacted: true } }];
    case CFA_SUIVI_CATEGORY.TOUS:
    default:
      return [];
  }
}

const SUIVI_PROJECT_STAGE = {
  $project: {
    _id: 0,
    id: "$effectif_snapshot._id",
    source: {
      $cond: [{ $ifNull: ["$effectif_snapshot.is_deca_compatible", false] }, "effectifsDECA", "effectifs"],
    },
    nom: "$_nom",
    prenom: "$_prenom",
    en_rupture: { $literal: true },
    is_plus_25: 1,
    is_moins_16: 1,
    date_rupture: "$date_rupture",
    libelle_formation: "$_libelle_formation",
    formation_niveau_libelle: { $ifNull: ["$effectif_snapshot.formation.niveau_libelle", null] },
    collab_status: 1,
    has_unread_notification: { $ifNull: ["$organisme_data.has_unread_notification", false] },
  },
};

export async function getCfaSuiviMissionLocale(
  organisation: IOrganisationOrganismeFormation,
  isAllowedDeca: boolean,
  params: CfaSuiviMissionLocaleQueryParams
): Promise<ICfaSuiviMissionLocaleResponse> {
  const { category, page, limit, search, sort, order, collab_status, formation } = params;
  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;

  const listFilterStages = buildSuiviUserFilterStages({ search, collab_status, formation });
  // Compteurs d'onglets : indépendants du filtre "Statut suivi ML" (collab_status), sinon un statut
  // incompatible avec l'onglet (ex. "Traité" sur l'onglet hors-collab) afficherait "(0)" à tort.
  const countFilterStages = buildSuiviUserFilterStages({ search, formation });
  const sortField = getSuiviSortField(sort);
  const sortStage = { $sort: { [sortField]: sortDirection, _id: 1 as const } };

  const pipeline = [
    ...buildSuiviBasePipeline(organisation, isAllowedDeca),
    {
      $facet: {
        effectifs: [
          ...listFilterStages,
          ...categoryMatchStage(category),
          sortStage,
          { $skip: skip },
          { $limit: limit },
          SUIVI_PROJECT_STAGE,
        ],
        // Total de la page (catégorie + tous les filtres, collab_status inclus) → pagination.
        count_page: [...listFilterStages, ...categoryMatchStage(category), { $count: "count" }],
        count_collab: [...countFilterStages, { $match: { is_collab: true } }, { $count: "count" }],
        count_hors_collab: [...countFilterStages, { $match: { is_hors_collab_contacted: true } }, { $count: "count" }],
        count_tous: [...countFilterStages, { $count: "count" }],
        formations: buildDistinctFacet("_libelle_formation"),
      },
    },
  ];

  const [result] = await missionLocaleEffectifsDb().aggregate(pipeline).toArray();

  const counts = {
    collab: result?.count_collab?.[0]?.count ?? 0,
    hors_collab: result?.count_hors_collab?.[0]?.count ?? 0,
    tous: result?.count_tous?.[0]?.count ?? 0,
  };

  const total = result?.count_page?.[0]?.count ?? 0;

  return {
    effectifs: (result?.effectifs ?? []) as ICfaEffectif[],
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    counts,
    filters: {
      formations: (result?.formations ?? []).map((f: { _id: string }) => f._id),
    },
    isAllowedDeca,
  };
}

export interface CfaSuiviExportRow {
  prenom: string;
  nom: string;
  en_rupture: string;
  libelle_formation: string;
  date_rupture: Date | null;
  collab_status_label: string;
  categorie: string;
  mission_locale_nom: string | null;
  situation_label: string;
}

const SUIVI_COLLAB_STATUS_EXPORT_LABELS: Record<string, string> = {
  demarrer_collab: "Pas encore de collaboration",
  collab_demandee: "Demande collab envoyée",
  contacte_par_ml_hors_collab: "Contacté par la ML hors collaboration",
  traite_par_ml: "Traité par la ML",
};

/**
 * Export "Exporter les dossiers suivis" : toutes les lignes des 3 catégories
 * (collab CFA + hors-collab contacté), indépendamment du sous-onglet affiché (RG8).
 */
export async function getCfaSuiviMissionLocaleExportRows(
  organisation: IOrganisationOrganismeFormation,
  isAllowedDeca: boolean
): Promise<CfaSuiviExportRow[]> {
  const pipeline = [
    ...buildSuiviBasePipeline(organisation, isAllowedDeca),
    {
      $lookup: {
        from: "organisations",
        localField: "mission_locale_id",
        foreignField: "_id",
        as: "_ml_orga",
        pipeline: [{ $project: { nom: 1 } }],
      },
    },
    { $sort: { is_collab: -1 as const, date_rupture: -1 as const } },
    {
      $project: {
        _id: 0,
        prenom: "$_prenom",
        nom: "$_nom",
        libelle_formation: "$_libelle_formation",
        date_rupture: "$date_rupture",
        collab_status: 1,
        is_collab: 1,
        situation: { $ifNull: ["$situation", null] },
        mission_locale_nom: { $ifNull: [{ $first: "$_ml_orga.nom" }, null] },
      },
    },
  ];

  const rows = await missionLocaleEffectifsDb().aggregate(pipeline).toArray();

  return rows.map((r) => ({
    prenom: r.prenom ?? "",
    nom: r.nom ?? "",
    en_rupture: "OUI",
    libelle_formation: r.libelle_formation ?? "",
    date_rupture: r.date_rupture ?? null,
    collab_status_label: SUIVI_COLLAB_STATUS_EXPORT_LABELS[r.collab_status] ?? r.collab_status ?? "",
    categorie: r.is_collab ? "Collaboration CFA" : "Hors collaboration",
    mission_locale_nom: r.mission_locale_nom ?? null,
    situation_label: r.situation ? (SITUATION_LABEL_ENUM[r.situation] ?? r.situation) : "Aucun retour",
  }));
}
