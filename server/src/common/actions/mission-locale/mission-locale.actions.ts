import { STATUT_APPRENANT } from "shared/constants";
import { IEffecifMissionLocale, IEffectif, IOrganisation, IUsersMigration } from "shared/models";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { effectifsDb } from "@/common/model/collections";

import { buildEffectifForMissionLocale } from "../effectifs.actions";
import { DateFilters } from "../helpers/filters";
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

export const getPaginatedEffectifsByMissionLocaleId = async (
  missionLocaleId: number,
  page: number = 1,
  limit: number = 20
) => {
  const aggregation = [
    {
      $match: {
        "apprenant.adresse.mission_locale_id": missionLocaleId,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
      },
    },
    ...filterByDernierStatutPipeline(
      [STATUT_APPRENANT.ABANDON, STATUT_APPRENANT.RUPTURANT, STATUT_APPRENANT.INSCRIT],
      new Date()
    ),
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

  if (!result) {
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
