import { ObjectId } from "mongodb";
import { IEffectif, IOrganisation, IUsersMigration } from "shared/models";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { organismeLookup } from "@/common/actions/helpers/filters";
import { effectifsDb } from "@/common/model/collections";

import { buildEffectifForMissionLocale } from "../effectifs.actions";

// Méthode de récupération de la liste des effectifs en base
export const getAllEffectifs = async (
  query = {},
  { page, limit, sort } = { page: 1, limit: 10, sort: { created_at: -1 } as { [key: string]: number } }
) => {
  const result = await effectifsDb()
    .aggregate([
      { $match: query },
      { $sort: sort },
      { $project: { is_lock: 0 } },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
      {
        $lookup: {
          from: "organismes",
          localField: "data.organisme_id",
          foreignField: "_id",
          as: "_tmp_organismes",
          pipeline: [{ $project: { uai: 1, siret: 1, nom: 1, fiabilisation_statut: 1 } }],
        },
      },
    ])
    .next();

  // difficile de mettre le resultat d'un lookup sur un champ nested dans un array, du coup on le fait programmatiquement
  const organismesById = result?._tmp_organismes?.reduce(
    (acc, organisme) => ({
      [organisme._id]: organisme,
      ...acc,
    }),
    {}
  );
  result?.data.forEach((effectif) => {
    effectif.organisme = organismesById[effectif.organisme_id];
  });
  delete result?._tmp_organismes;

  if (result?.pagination) {
    result.pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  return result;
};

// Méthode de récupération d'un effectif et de ses détails (formation, doublons, ...) depuis son id
export const getDetailedEffectifById = async (_id: any) => {
  const organisme = await effectifsDb()
    .aggregate(
      [
        { $match: { _id: new ObjectId(_id) } },
        {
          // Retro-compatibilité sur un lookup non existant
          $addField: {
            formations: [],
          },
        },
        { $lookup: organismeLookup },
        { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },

        { $project: { is_lock: 0, organisme_id: 0 } },
        { $unwind: { path: "$formation_detail", preserveNullAndEmptyArrays: true } },
        // lookup effectifsQueue
        {
          $lookup: {
            from: "effectifsQueue",
            localField: "_id",
            foreignField: "effectif_id",
            as: "effectifsQueue",
          },
        },
        // lookup for doublons (including same apprenant, but different annee_scolaire)
        {
          $lookup: {
            from: "effectifs",
            as: "effectifsDoublon",
            let: {
              id: "$_id",
              source: "$source",
              id_erp_apprenant: "$id_erp_apprenant",
              nom: "$apprenant.nom",
              prenom: "$apprenant.prenom",
              date_de_naissance: "$apprenant.date_de_naissance",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $not: { $eq: ["$_id", "$$id"] } },
                      {
                        $or: [
                          {
                            $and: [
                              { $gt: ["$apprenant.nom", null] },
                              { $eq: ["$apprenant.nom", "$$nom"] },
                              { $gt: ["$apprenant.prenom", null] },
                              { $eq: ["$apprenant.prenom", "$$prenom"] },
                              { $gt: ["$apprenant.date_de_naissance", null] },
                              { $eq: ["$apprenant.date_de_naissance", "$$date_de_naissance"] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  ...organismeLookup,
                  pipeline: [{ $project: { uai: 1, siret: 1, nom: 1, fiabilisation_statut: 1, created_at: 1 } }],
                },
              },
              { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
              { $project: { is_lock: 0, organisme_id: 0 } },
            ],
          },
        },
      ],
      { collation: { locale: "simple", strength: 1 } }
    )
    .next();

  return organisme;
};

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
      $unwind: {
        path: "$cfa_users",
        preserveNullAndEmptyArrays: true,
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
    data: Array<IEffectif & { organisation: IOrganisation } & { cfa_users: IUsersMigration }>;
  };

  if (!result) {
    return { pagination: { total: 0, page, limit }, data: [] };
  }

  if (result.pagination) {
    result.pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  result.data = result.data.map((effectif) => buildEffectifForMissionLocale(effectif));
  return result;
};
