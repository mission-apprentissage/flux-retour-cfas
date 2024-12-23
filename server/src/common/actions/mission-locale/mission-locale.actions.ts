import { ObjectId } from "bson";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffecifMissionLocale, IEffectif, IOrganisation, IUsersMigration } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { effectifsDb, missionLocaleEffectifsDb } from "@/common/model/collections";

import { buildEffectifForMissionLocale } from "../effectifs.actions";
import { buildSortFilter, DateFilters, IEffectifsFiltersMissionLocale, WithPagination } from "../helpers/filters";
import { buildIndicateursEffectifsPipeline, filterByDernierStatutPipeline } from "../indicateurs/indicateurs.actions";

export const EFF_MISSION_LOCALE_FILTER = [
  {
    $match: {
      $or: [
        { "apprenant.date_de_naissance": { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 27)) } },
        { "apprenant.rqth": true },
      ],
    },
  },
];

export const buildFiltersForMissionLocale = (effectifFilters: IEffectifsFiltersMissionLocale) => {
  const {
    statut = null,
    rqth = null,
    mineur = null,
    niveaux = null,
    code_insee = null,
    search = null,
  } = effectifFilters;

  const filter = [
    ...filterByDernierStatutPipeline(
      (statut as Array<StatutApprenant>) ?? [
        STATUT_APPRENANT.ABANDON,
        STATUT_APPRENANT.RUPTURANT,
        STATUT_APPRENANT.INSCRIT,
      ],
      new Date()
    ),
    {
      $match: {
        ...(search !== null
          ? {
              $or: search
                .trim()
                .split(" ")
                .reduce((acc: Array<object>, currentSearch) => {
                  return [
                    ...acc,
                    { "apprenant.nom": { $regex: currentSearch, $options: "i" } },
                    { "apprenant.prenom": { $regex: currentSearch, $options: "i" } },
                  ];
                }, []),
            }
          : {}),
        ...(rqth !== null ? { "apprenant.rqth": rqth } : {}),
        ...(mineur !== null
          ? { "apprenant.date_de_naissance": { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)) } }
          : {}),
        ...(niveaux ? { "formation.niveau": { $in: niveaux } } : {}),
        ...(code_insee ? { "apprenant.adresse.code_insee": { $in: code_insee } } : {}),
      },
    },
  ];

  return filter;
};

export const getPaginatedEffectifsByMissionLocaleId = async (
  missionLocaleId: number,
  effectifsFiltersMissionLocale: WithPagination<IEffectifsFiltersMissionLocale>
) => {
  const { page = 1, limit = 20, sort = "nom", order = "asc", ...effectifFilters } = effectifsFiltersMissionLocale;
  const aggregation = [
    {
      $match: {
        "apprenant.adresse.mission_locale_id": missionLocaleId,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
      },
    },
    ...buildFiltersForMissionLocale(effectifFilters),
    ...EFF_MISSION_LOCALE_FILTER,
    { $addFields: { stringify_organisme_id: { $toString: "$organisme_id" } } },
    {
      $lookup: {
        from: "organisations",
        localField: "stringify_organisme_id",
        foreignField: "organisme_id",
        as: "organisation",
      },
    },
    {
      $unwind: {
        path: "$organisation",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "usersMigration",
        localField: "organisation._id",
        foreignField: "organisation_id",
        as: "cfa_users",
      },
    },
    {
      $sort: buildSortFilter(sort, order),
    },
    {
      $facet: {
        pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
    { $unwind: { path: "$pagination", preserveNullAndEmptyArrays: true } },
  ];
  const result = (await effectifsDb().aggregate(aggregation).next()) as {
    pagination: any;
    data: Array<IEffectif & { organisation: IOrganisation } & { cfa_users: Array<IUsersMigration> }>;
  };

  if (!result || result?.data.length === 0) {
    return { pagination: { total: 0, page, limit }, data: [] };
  }
  const { pagination, data } = result;

  if (pagination) {
    pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  const effectifs: Array<IEffecifMissionLocale> = data.map((effectif) => buildEffectifForMissionLocale(effectif));
  return { pagination, data: effectifs };
};

export const getEffectifIndicateursForMissionLocaleId = async (filters: DateFilters, missionLocaleId: number) => {
  const aggregation = [
    {
      $match: {
        "apprenant.adresse.mission_locale_id": missionLocaleId,
      },
    },
    ...EFF_MISSION_LOCALE_FILTER,
    ...buildIndicateursEffectifsPipeline(null, filters.date),
    {
      $project: {
        _id: 0,
        inscrits: 1,
        abandons: 1,
        rupturants: 1,
      },
    },
  ];
  const indicateurs = await effectifsDb().aggregate(aggregation).toArray();
  return indicateurs ?? { inscrits: 0, abandons: 0, rupturants: 0 };
};

export const setEffectifMissionLocaleData = async (
  missionLocaleId: ObjectId,
  data: { effectifId: string; situation: SITUATION_ENUM }
) => {
  return missionLocaleEffectifsDb().updateOne(
    {
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(data.effectifId),
    },
    {
      $set: {
        situation: data.situation,
      },
    },
    { upsert: true }
  );
};
