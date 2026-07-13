import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationOrganismeFormation } from "shared/models";
import { ICfaRuptureEffectif, ICfaRupturesResponse } from "shared/models/routes/organismes/cfa";
import { getAnneeScolaireListFromDateRange } from "shared/utils";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import {
  DATE_START_RUPTURES,
  buildCollabStatusOrderField,
  buildCollabStatusSwitch,
  buildCsvInConditions,
  buildDistinctFacet,
  buildEffRuptureAgeFilter,
  buildNameSearchConditions,
  createDernierStatutFieldPipeline,
} from "../shared/rupture-pipeline.utils";

export interface CfaRupturesQueryParams {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
  collab_status?: string;
  formation?: string;
}

function getRuptureSortField(sort: string): string {
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

function buildCfaOrganismeMatchStages(organisation: IOrganisationOrganismeFormation, isAllowedDeca: boolean) {
  if (!organisation.organisme_id) {
    throw new Error("organisme_id is required");
  }
  const organismeId = new ObjectId(organisation.organisme_id);

  const stages: Record<string, unknown>[] = [
    {
      $match: {
        "effectif_snapshot.organisme_id": organismeId,
      },
    },
  ];

  if (!isAllowedDeca) {
    stages.push({
      $match: { "effectif_snapshot.is_deca_compatible": { $exists: false } },
    });
  }

  stages.push({
    $match: {
      "effectif_snapshot.annee_scolaire": { $in: getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date()) },
    },
  });

  return stages;
}

export async function getCfaEffectifsEnRupture(
  organisation: IOrganisationOrganismeFormation,
  isAllowedDeca: boolean,
  params: CfaRupturesQueryParams
): Promise<ICfaRupturesResponse> {
  const now = new Date();
  const { page, limit, search, sort, order, collab_status, formation } = params;
  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;

  // Pipeline de base : sélection des effectifs en rupture éligibles + champs calculés.
  const basePipeline: Record<string, unknown>[] = [
    ...buildCfaOrganismeMatchStages(organisation, isAllowedDeca),
    ...buildEffRuptureAgeFilter(),
    // Normalize date_rupture: use cfa_rupture_declaration.date_rupture as fallback
    {
      $addFields: {
        date_rupture: {
          $ifNull: ["$date_rupture", "$cfa_rupture_declaration.date_rupture"],
        },
      },
    },
    ...createDernierStatutFieldPipeline(),
    // Include both system-detected ruptures AND CFA-declared ruptures
    {
      $match: {
        $or: [
          {
            "effectif_snapshot._computed.statut.en_cours": STATUT_APPRENANT.RUPTURANT,
            date_rupture: { $lte: now },
          },
          {
            cfa_rupture_declaration: { $exists: true },
          },
        ],
      },
    },
    { $match: { dernierStatutDureeInDay: { $lte: 180 } } },
    // Exclude effectifs who have since become APPRENTI again,
    // but only for system-detected ruptures (not CFA manual declarations,
    // where the ERP may not have updated the status yet)
    {
      $match: {
        $or: [
          { cfa_rupture_declaration: { $exists: true } },
          { "current_status.value": { $ne: STATUT_APPRENANT.APPRENTI } },
        ],
      },
    },
    {
      $addFields: {
        _nom: { $ifNull: ["$identifiant_normalise.nom", "$effectif_snapshot.apprenant.nom"] },
        _prenom: { $ifNull: ["$identifiant_normalise.prenom", "$effectif_snapshot.apprenant.prenom"] },
        _libelle_formation: "$effectif_snapshot.formation.libelle_long",
        collab_status: buildCollabStatusSwitch(),
        // Section "+45j après rupture" : dossier transmis automatiquement à la ML (>= 45 jours).
        is_transmis_auto: { $gte: ["$dernierStatutDureeInDay", 45] },
      },
    },
    { $addFields: { collab_status_order: buildCollabStatusOrderField() } },
  ];

  // Filtres utilisateur (recherche / statut collab / formation) appliqués dans chaque branche du $facet.
  const filterConditions: Record<string, unknown>[] = [
    ...buildNameSearchConditions(search, "_nom", "_prenom"),
    ...buildCsvInConditions("collab_status", collab_status),
    ...buildCsvInConditions("_libelle_formation", formation),
  ];
  const userFilterStages = filterConditions.length > 0 ? [{ $match: { $and: filterConditions } }] : [];

  // Tri : sections d'abord (< 45j puis >= 45j), puis tri demandé au sein de chaque section.
  const sortField = getRuptureSortField(sort);
  const sortStage = { $sort: { is_transmis_auto: 1 as const, [sortField]: sortDirection, _id: 1 as const } };

  const projectStage = {
    $project: {
      _id: 0,
      id: "$effectif_snapshot._id",
      nom: "$_nom",
      prenom: "$_prenom",
      date_rupture: "$date_rupture",
      jours_depuis_rupture: "$dernierStatutDureeInDay",
      is_transmis_auto: 1,
      libelle_formation: "$_libelle_formation",
      formation_niveau_libelle: { $ifNull: ["$effectif_snapshot.formation.niveau_libelle", null] },
      collab_status: 1,
      has_unread_notification: { $ifNull: ["$organisme_data.has_unread_notification", false] },
    },
  };

  basePipeline.push({
    $facet: {
      total: [...userFilterStages, { $count: "count" }],
      moins_45j: [...userFilterStages, { $match: { is_transmis_auto: false } }, { $count: "count" }],
      plus_45j: [...userFilterStages, { $match: { is_transmis_auto: true } }, { $count: "count" }],
      effectifs: [...userFilterStages, sortStage, { $skip: skip }, { $limit: limit }, projectStage],
      // Formations : liste complète (avant filtres utilisateur) pour alimenter le dropdown.
      formations: buildDistinctFacet("_libelle_formation"),
    },
  });

  const [result] = await missionLocaleEffectifsDb().aggregate(basePipeline).toArray();

  const total = result?.total?.[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    effectifs: (result?.effectifs ?? []) as ICfaRuptureEffectif[],
    pagination: { page, limit, total, totalPages },
    counts: {
      moins_45j: result?.moins_45j?.[0]?.count ?? 0,
      plus_45j: result?.plus_45j?.[0]?.count ?? 0,
    },
    filters: {
      formations: (result?.formations ?? []).map((f: { _id: string }) => f._id),
    },
    isAllowedDeca,
  };
}
