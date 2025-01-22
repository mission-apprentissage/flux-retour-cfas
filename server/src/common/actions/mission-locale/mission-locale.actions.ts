import type { IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import { ObjectId } from "bson";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffecifMissionLocale, IEffectif, IOrganisation, IUsersMigration } from "shared/models";
import { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import {
  effectifsFiltersMissionLocaleSchema,
  IEffectifsFiltersMissionLocale,
} from "shared/models/routes/mission-locale/missionLocale.api";
import { WithPagination } from "shared/models/routes/pagination";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { IUpdateMissionLocaleEffectif } from "@/common/apis/missions-locale/mission-locale.api";
import {
  effectifsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogsDb,
  organisationsDb,
} from "@/common/model/collections";

import { buildEffectifForMissionLocale } from "../effectifs.actions";
import { buildSortFilter, DateFilters } from "../helpers/filters";
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

const A_RISQUE_FILTER = [
  {
    $addFields: {
      a_risque: {
        $cond: {
          if: {
            $or: [
              { $eq: ["$dernierStatut", STATUT_APPRENANT.ABANDON] },
              {
                $and: [
                  { $eq: [{ $getField: { field: "valeur", input: "$dernierStatut" } }, STATUT_APPRENANT.RUPTURANT] },
                  { $gt: ["$dernierStatutDureeInDay", 150] },
                ],
              }, // 5 mois en jours
              {
                $and: [
                  { $eq: [{ $getField: { field: "valeur", input: "$dernierStatut" } }, STATUT_APPRENANT.INSCRIT] },
                  { $gt: ["$dernierStatutDureeInDay", 60] },
                ],
              }, // 2 mois en jours
            ],
          },
          then: true,
          else: false,
        },
      },
    },
  },

  { $match: { a_risque: true } },
];

export const buildFiltersForMissionLocale = (effectifFilters: IEffectifsFiltersMissionLocale) => {
  const {
    statut = null,
    rqth = null,
    mineur = null,
    niveaux = null,
    code_insee = null,
    search = null,
    situation = null,
    a_risque = null,
    last_update_value = null,
    last_update_order = null,
  } = effectifFilters;

  const today = new Date();
  const adultThreshold = new Date(today.setFullYear(today.getFullYear() - 18));

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
        ...(rqth !== null && rqth.length > 0
          ? {
              $or: [
                { "apprenant.rqth": { $in: rqth } },
                ...(rqth.includes(false) ? [{ "apprenant.rqth": { $exists: false } }] : []),
              ],
            }
          : {}),
        ...(mineur !== null && mineur.length > 0
          ? mineur.includes(true) && mineur.includes(false)
            ? {}
            : mineur.includes(true)
              ? { "apprenant.date_de_naissance": { $gte: adultThreshold } }
              : { "apprenant.date_de_naissance": { $lt: adultThreshold } }
          : {}),
        ...(niveaux !== null ? { "formation.niveau": { $in: niveaux } } : {}),
        ...(code_insee !== null ? { "apprenant.adresse.code_insee": { $in: code_insee } } : {}),
        ...(situation !== null ? { "ml_effectif.situation": { $in: situation } } : {}),
        ...(last_update_value !== null && last_update_order !== null
          ? {
              updated_at: {
                [last_update_order === "AFTER" ? "$gte" : "$lte"]: new Date(
                  new Date().setDate(new Date().getDate() - last_update_value)
                ),
              },
            }
          : {}),
      },
    },
    ...(a_risque ? A_RISQUE_FILTER : []),
  ];

  return filter;
};

const generateMissionLocaleMatchStage = (missionLocaleId: number) => {
  return {
    $match: {
      "apprenant.adresse.mission_locale_id": missionLocaleId,
      annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
    },
  };
};

const generateUnionWithEffectifDECA = (missionLocaleId: number) => {
  return [
    generateMissionLocaleMatchStage(missionLocaleId),
    {
      $unionWith: {
        coll: "effectifsDECA",
        pipeline: [generateMissionLocaleMatchStage(missionLocaleId), { $match: { is_deca_compatible: true } }],
      },
    },
  ];
};

export const getPaginatedEffectifsByMissionLocaleId = async (
  missionLocaleId: number,
  missionLocaleMongoId: ObjectId,
  effectifsFiltersMissionLocale: WithPagination<typeof effectifsFiltersMissionLocaleSchema>
) => {
  const { page = 1, limit = 20, sort = "nom", order = "asc", ...effectifFilters } = effectifsFiltersMissionLocale;

  const effectifMissionLocaleLookupAggregation = [
    {
      $lookup: {
        let: { missionLocaleMongoId: new ObjectId(missionLocaleMongoId), effectif_id: "$_id" },
        from: "missionLocaleEffectif",
        as: "ml_effectif",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$mission_locale_id", "$$missionLocaleMongoId"] },
                  { $eq: ["$effectif_id", "$$effectif_id"] },
                ],
              },
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$ml_effectif",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const adresseFilterAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    {
      $match: {
        "apprenant.adresse.code_insee": { $exists: true },
      },
    },
    {
      $group: {
        _id: "$apprenant.adresse.code_insee",
        commune: {
          $addToSet: {
            code_insee: "$apprenant.adresse.code_insee",
            code_postal: "$apprenant.adresse.code_postal",
            commune: "$apprenant.adresse.commune",
          },
        },
      },
    },
    {
      $unwind: {
        path: "$commune",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        code_insee: "$commune.code_insee",
        code_postal: "$commune.code_postal",
        commune: "$commune.commune",
      },
    },
  ];

  const effectifsAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
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
    ...effectifMissionLocaleLookupAggregation,
    ...buildFiltersForMissionLocale(effectifFilters),
    ...EFF_MISSION_LOCALE_FILTER,
    {
      $lookup: {
        from: "usersMigration",
        localField: "organisation._id",
        foreignField: "organisation_id",
        as: "cfa_users",
      },
    },
    ...A_RISQUE_FILTER,
    {
      $sort: buildSortFilter(sort, order),
    },
    {
      $facet: {
        pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
        data: [{ $skip: page * limit }, { $limit: limit }],
      },
    },
    { $unwind: { path: "$pagination", preserveNullAndEmptyArrays: true } },
  ];

  const resultEffectif = (await effectifsDb().aggregate(effectifsAggregation).next()) as {
    pagination: any;
    data: Array<
      IEffectif & { organisation: IOrganisation } & { cfa_users: Array<IUsersMigration> } & {
        a_risque: boolean;
      } & {
        ml_effectif: IMissionLocaleEffectif;
      }
    >;
  };

  const resultAdresse = await effectifsDb().aggregate(adresseFilterAggregation).toArray();

  if (!resultEffectif || resultEffectif?.data.length === 0) {
    return { pagination: { total: 0, page, limit }, data: [], filter: resultAdresse };
  }

  const { pagination, data } = resultEffectif;

  if (pagination) {
    pagination.lastPage = Math.ceil(pagination.total / limit);
  }
  const effectifs: Array<IEffecifMissionLocale> = data.map((effectif) => buildEffectifForMissionLocale(effectif));

  return { pagination, data: effectifs, filter: resultAdresse };
};

export const getEffectifIndicateursForMissionLocaleId = async (filters: DateFilters, missionLocaleId: number) => {
  const aggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
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

  const indicateurs = await effectifsDb().aggregate(aggregation).next();
  return indicateurs ?? { inscrits: 0, abandons: 0, rupturants: 0 };
};

export const setEffectifMissionLocaleData = async (missionLocaleId: ObjectId, data: IUpdateMissionLocaleEffectif) => {
  const {
    effectif_id,
    situation,
    statut_reel,
    statut_reel_text,
    inscrit_france_travail,
    commentaires,
    statut_correct,
  } = data;

  const setObject = {
    ...(situation !== undefined ? { situation } : {}),
    ...(statut_reel !== undefined ? { statut_reel } : {}),
    ...(statut_reel_text !== undefined ? { statut_reel_text } : {}),
    ...(inscrit_france_travail !== undefined ? { inscrit_france_travail } : {}),
    ...(commentaires !== undefined ? { commentaires } : {}),
    ...(statut_correct !== undefined && statut_correct !== null ? { statut_correct } : {}),
  };

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(effectif_id),
    },
    {
      $set: {
        ...setObject,
        ...(situation !== undefined ? { situation_updated_at: new Date() } : {}),
      },
    },
    { upsert: true }
  );

  const toUpdateId = updated.lastErrorObject?.upserted || updated.value?._id;
  if (toUpdateId) {
    await missionLocaleEffectifsLogsDb().insertOne({
      created_at: new Date(),
      _id: new ObjectId(),
      mission_locale_effectif_id: toUpdateId,
      payload: setObject,
    });
  }
};

export const getOrCreateMissionLocaleById = async (id: number) => {
  const mlDb = await organisationsDb().findOne({ ml_id: id });

  if (mlDb) {
    return mlDb;
  }
  const allMl = await apiAlternanceClient.geographie.listMissionLocales();
  const ml: IMissionLocale | undefined = allMl.find((ml) => ml.id === id);
  if (!ml) {
    Boom.notFound(`Mission locale with id ${id} not found`);
    return;
  }

  const orga = await organisationsDb().insertOne({
    _id: new ObjectId(),
    type: "MISSION_LOCALE",
    created_at: new Date(),
    ml_id: ml.id,
    nom: ml.nom,
    siret: ml.siret,
  });

  return organisationsDb().findOne({ _id: orga.insertedId });
};
