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
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

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
    $match: {
      $or: [
        { dernierStatut: STATUT_APPRENANT.ABANDON },
        { $and: [{ "dernierStatut.valeur": STATUT_APPRENANT.RUPTURANT }, { dernierStatutDureeInDay: { $gt: 150 } }] }, // 5 mois en jours
        { $and: [{ "dernierStatut.valeur": STATUT_APPRENANT.INSCRIT }, { dernierStatutDureeInDay: { $gt: 60 } }] }, // 2 mois en
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
    situation = null,
    a_risque = null,
    last_update_value = null,
    last_update_order = null,
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
        pipeline: [generateMissionLocaleMatchStage(missionLocaleId)],
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
            nom: "$apprenant.adresse.commune",
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
        nom: "$commune.nom",
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

  const resultEffectif = (await effectifsDb().aggregate(effectifsAggregation).next()) as {
    pagination: any;
    data: Array<
      IEffectif & { organisation: IOrganisation } & { cfa_users: Array<IUsersMigration> } & {
        ml_effectif: IMissionLocaleEffectif;
      }
    >;
  };

  const resultAdresse = await effectifsDb().aggregate(adresseFilterAggregation).toArray();

  if (!resultEffectif || resultEffectif?.data.length === 0) {
    return { pagination: { total: 0, page, limit }, data: [], filter: [] };
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

  return missionLocaleEffectifsDb().updateOne(
    {
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(effectif_id),
    },
    {
      $set: {
        ...(situation !== undefined ? { situation } : {}),
        ...(statut_reel !== undefined ? { statut_reel } : {}),
        ...(statut_reel_text !== undefined ? { statut_reel_text } : {}),
        ...(inscrit_france_travail !== undefined ? { inscrit_france_travail } : {}),
        ...(commentaires !== undefined ? { commentaires } : {}),
        ...(statut_correct !== undefined ? { statut_correct } : {}),
        ...(situation !== undefined ? { situation_updated_at: new Date() } : {}),
      },
    },
    { upsert: true }
  );
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
