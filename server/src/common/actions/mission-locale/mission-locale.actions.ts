import type { IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import { ObjectId } from "bson";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import {
  IEffecifMissionLocale,
  IEffectif,
  IOrganisation,
  IOrganisme,
  IStatutApprenantEnum,
  IUsersMigration,
} from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import {
  API_TRAITEMENT_TYPE,
  IMissionLocaleEffectif,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import {
  effectifsFiltersMissionLocaleSchema,
  IEffectifsFiltersMissionLocale,
  IEffectifsParMoisFiltersMissionLocaleSchema,
} from "shared/models/routes/mission-locale/missionLocale.api";
import { IPaginationFilters, WithPagination } from "shared/models/routes/pagination";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { IUpdateMissionLocaleEffectif } from "@/common/apis/missions-locale/mission-locale.api";
import logger from "@/common/logger";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogsDb,
  organisationsDb,
  usersMigrationDb,
} from "@/common/model/collections";

import { buildEffectifForMissionLocale } from "../effectifs.actions";
import { buildSortFilter, DateFilters } from "../helpers/filters";
import {
  buildIndicateursEffectifsPipeline,
  createDernierStatutFieldPipeline,
} from "../indicateurs/indicateurs.actions";

/**
 * Filtre constant pour les missions locales
 */
const EFF_MISSION_LOCALE_FILTER = [
  {
    $match: {
      $or: [
        { "apprenant.date_de_naissance": { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 26)) } },
        { "apprenant.rqth": true },
      ],
    },
  },
];

/**
 * Filtre par défaut pour les missions locales : sur les statuts, puis sur la date du dernier statut
 *
 * @returns Objet de filtre
 */
const buildDefaultSortFilter = () => {
  return {
    "dernierStatut.date": -1,
  };
};

/**
 * Filtre sur les jeunes a risque
 * @param a_risque Boolean Si l'on doit appliquer le filtre ou non
 * @returns Objet pour addFields et match
 */
const buildARisqueFilter = (a_risque: boolean | null = false) => [
  {
    $addFields: {
      a_risque: {
        $cond: {
          if: {
            $or: [
              { $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.ABANDON] },
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
  ...(a_risque ? [{ $match: { a_risque: true } }] : []),
];

/**
 * Application des filtres sur les dernier statut en fonction de la liste de statut et de la date
 * @param statut Liste des status a filtrer
 * @param date Date de calcul du filtre
 * @returns Une liste de addFields et de match
 */
const filterByDernierStatutPipelineMl = (statut: Array<StatutApprenant>, date: Date) =>
  statut.length ? [...createDernierStatutFieldPipeline(date), matchDernierStatutPipelineMl(statut)] : [];

/**
 * Création du match sur les dernier statuts
 * @param statut Liste de statuts à matcher
 * @returns Un obet match
 */
const matchDernierStatutPipelineMl = (statut): any => {
  return {
    $match: {
      $or: statut.map((s) => ({ "dernierStatut.valeur": s })),
    },
  };
};

/**
 * Création des filtres dynamique
 * @param effectifFilters Liste de filtre dynamique
 * @returns Liste de matches
 */
const buildFiltersForMissionLocale = (effectifFilters: IEffectifsFiltersMissionLocale) => {
  const {
    statut = [STATUT_APPRENANT.RUPTURANT],
    rqth,
    mineur,
    niveaux,
    code_adresse,
    search,
    situation,
    a_risque,
    last_update_value,
    last_update_order,
  } = effectifFilters;

  const today = new Date();
  const adultThreshold = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const updateDateThreshold =
    typeof last_update_value === "number" && last_update_value >= 0
      ? new Date(today.setDate(today.getDate() - last_update_value))
      : null;

  const filter: Array<any> = [
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    {
      $match: {
        ...(search
          ? {
              $or: search
                .trim()
                .split(" ")
                .map((currentSearch) => ({
                  $or: [
                    { "apprenant.nom": { $regex: currentSearch, $options: "i" } },
                    { "apprenant.prenom": { $regex: currentSearch, $options: "i" } },
                    { "organisme.siret": { $regex: currentSearch, $options: "i" } },
                    { "organisme.nom": { $regex: currentSearch, $options: "i" } },
                    { "organisme.raison_sociale": { $regex: currentSearch, $options: "i" } },
                    { "organisme.enseigne": { $regex: currentSearch, $options: "i" } },
                  ],
                })),
            }
          : {}),
        ...(rqth !== undefined
          ? {
              $or: [{ "apprenant.rqth": rqth }, ...(rqth === false ? [{ "apprenant.rqth": { $exists: false } }] : [])],
            }
          : {}),
        ...(mineur !== undefined
          ? mineur
            ? { "apprenant.date_de_naissance": { $gte: adultThreshold } }
            : { "apprenant.date_de_naissance": { $lt: adultThreshold } }
          : {}),
        ...(niveaux ? { "formation.niveau": { $in: niveaux } } : {}),
        ...(code_adresse && code_adresse.length > 0
          ? {
              $or: code_adresse.map((adresse) => {
                const [code_insee, code_postal] = adresse.split("-");
                return {
                  "apprenant.adresse.code_insee": code_insee,
                  "apprenant.adresse.code_postal": code_postal,
                };
              }),
            }
          : {}),
        ...(situation ? { "ml_effectif.situation": { $in: situation } } : {}),

        ...(updateDateThreshold && last_update_order
          ? last_update_order === "AFTER"
            ? {
                $or: [
                  {
                    transmitted_at: {
                      $lt: updateDateThreshold,
                    },
                  },
                  {
                    transmitted_at: null,
                  },
                ],
              }
            : {
                transmitted_at: {
                  $gte: updateDateThreshold,
                },
              }
          : {}),
      },
    },
    ...buildARisqueFilter(a_risque),
  ];

  return filter;
};

/**
 * Création du filtre sur la mission locale concerné
 * @param missionLocaleId Id de la mission locale
 * @returns Objet match
 */
const generateMissionLocaleMatchStage = (missionLocaleId: number) => {
  return {
    $match: {
      "apprenant.adresse.mission_locale_id": missionLocaleId,
      annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
    },
  };
};

/**
 * Union des données avec DECA
 * @param missionLocaleId Id de la mission locale
 * @returns Objet unionWith
 */
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

const effectifMissionLocaleLookupAggregation = (missionLocaleMongoId: ObjectId) => {
  const A_TRAITER_CONDIITON = {
    $or: [
      { $eq: ["$ml_effectif.situation", "$$REMOVE"] },
      {
        $in: ["$ml_effectif.situation", [SITUATION_ENUM.A_CONTACTER]],
      },
    ],
  };

  return [
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
    {
      $addFields: {
        a_traiter: {
          $cond: [A_TRAITER_CONDIITON, true, false],
        },
      },
    },
  ];
};

/**
 * Aggregation pour récupérer les effectifs en fonction de la mission locale et de filtres
 * @param missionLocaleId Id de la mission locale
 * @param missionLocaleMongoId Id du tdb de la mission locale
 * @param effectifsFiltersMissionLocale Liste de filtre pour les effectifs
 * @returns Les données d'effectif paginées
 */
export const getPaginatedEffectifsByMissionLocaleId = async (
  missionLocaleId: number,
  missionLocaleMongoId: ObjectId,
  effectifsFiltersMissionLocale: WithPagination<typeof effectifsFiltersMissionLocaleSchema>
) => {
  const { page = 1, limit = 20, ...effectifFilters } = effectifsFiltersMissionLocale;

  const adresseFilterAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl([STATUT_APPRENANT.RUPTURANT], new Date()),
    {
      $match: {
        "apprenant.adresse.code_insee": { $exists: true },
        "apprenant.adresse.code_postal": { $exists: true },
        "apprenant.adresse.commune": { $exists: true },
      },
    },
    {
      $group: {
        _id: {
          code_insee: "$apprenant.adresse.code_insee",
          code_postal: "$apprenant.adresse.code_postal",
        },
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
    {
      $sort: { commune: 1 },
    },
  ];

  const effectifsAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
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
    ...effectifMissionLocaleLookupAggregation(missionLocaleMongoId),
    {
      $lookup: {
        from: "organismes",
        let: { id: "$organisme_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: 0,
              contacts_from_referentiel: 1,
              nom: 1,
              raison_sociale: 1,
              adresse: 1,
              siret: 1,
              enseigne: 1,
            },
          },
        ],
        as: "organisme",
      },
    },
    {
      $unwind: {
        path: "$organisme",
        preserveNullAndEmptyArrays: true,
      },
    },
    ...buildFiltersForMissionLocale(effectifFilters),
    {
      $lookup: {
        from: "usersMigration",
        localField: "organisation._id",
        foreignField: "organisation_id",
        as: "cfa_users",
      },
    },
    {
      $sort: buildDefaultSortFilter(),
    },
    {
      $facet: {
        pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
        data: [{ $skip: page * limit }, { $limit: limit }],
      },
    },
    { $unwind: { path: "$pagination", preserveNullAndEmptyArrays: true } },
  ];

  const totalApprenantsAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl([STATUT_APPRENANT.RUPTURANT], new Date()),
    {
      $count: "totalApprenants",
    },
  ];

  const [resultEffectif, totalApprenantsResult] = await Promise.all([
    (await effectifsDb().aggregate(effectifsAggregation).next()) as {
      pagination: IPaginationFilters;
      data: Array<
        IEffectif & { organisation: IOrganisation } & { organisme: IOrganisme } & {
          cfa_users: Array<IUsersMigration>;
        } & {
          a_risque: boolean;
        } & {
          ml_effectif: IMissionLocaleEffectif;
        }
      >;
    },
    effectifsDb().aggregate(totalApprenantsAggregation).next(),
  ]);
  const resultAdresse = await effectifsDb().aggregate(adresseFilterAggregation).toArray();

  const totalApprenants = totalApprenantsResult?.totalApprenants || 0;

  if (!resultEffectif || resultEffectif?.data.length === 0) {
    return { pagination: { total: 0, page, limit }, data: [], filter: resultAdresse, totalApprenants };
  }

  const { pagination, data } = resultEffectif;

  if (pagination && pagination.total) {
    pagination.lastPage = Math.ceil(pagination.total / limit);
  }

  const effectifs: Array<IEffecifMissionLocale> = data.map((effectif) => buildEffectifForMissionLocale(effectif));

  return { pagination, data: effectifs, filter: resultAdresse, totalApprenants };
};

export const getEffectifIndicateursForMissionLocaleId = async (filters: DateFilters, missionLocaleId: number) => {
  const aggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...buildIndicateursEffectifsPipeline(
      null,
      filters.date,
      {},
      filterByDernierStatutPipelineMl([STATUT_APPRENANT.RUPTURANT], new Date())
    ),
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
    { upsert: true, returnDocument: "after" }
  );

  const toUpdateId = updated.lastErrorObject?.upserted || updated.value?._id;
  let statut: IStatutApprenantEnum | null = null;
  let effectif: IEffectif | IEffectifDECA | null = await effectifsDb().findOne({ _id: new ObjectId(effectif_id) });
  if (!effectif) {
    effectif = await effectifsDECADb().findOne({ _id: new ObjectId(effectif_id) });
  }

  if (effectif) {
    statut = effectif._computed?.statut?.en_cours ?? null;
  }

  if (toUpdateId) {
    await missionLocaleEffectifsLogsDb().insertOne({
      created_at: new Date(),
      _id: new ObjectId(),
      mission_locale_effectif_id: toUpdateId,
      payload: setObject,
      statut,
    });
  }

  return updated;
};

export const getOrCreateMissionLocaleById = async (id: number) => {
  const mlDb = await organisationsDb().findOne({ ml_id: id });

  if (mlDb) {
    return mlDb;
  }
  const allMl = await apiAlternanceClient.geographie.listMissionLocales({});
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

export const getPaginatedOrganismesByMissionLocaleId = async (
  missionLocaleId: number,
  organismesFiltersMissionLocale: IPaginationFilters
) => {
  const { page = 0, limit = 20, sort = "nom", order = "asc" } = organismesFiltersMissionLocale;
  const statut = [STATUT_APPRENANT.RUPTURANT];
  const organismeMissionLocaleAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    {
      $group: {
        _id: "$organisme_id",
        inscrits: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.INSCRIT] }, 1, 0],
          },
        },
        abandons: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.ABANDON] }, 1, 0],
          },
        },
        rupturants: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.RUPTURANT] }, 1, 0],
          },
        },
      },
    },
    {
      $facet: {
        pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
        data: [
          { $addFields: { stringify_organisme_id: { $toString: "$_id" } } },
          {
            $lookup: {
              from: "organismes",
              localField: "_id",
              foreignField: "_id",
              as: "organisme",
            },
          },
          {
            $unwind: {
              path: "$organisme",
              preserveNullAndEmptyArrays: true,
            },
          },
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
              let: { id: "$organisation._id" },
              from: "usersMigration",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$organisation_id", "$$id"],
                    },
                  },
                },
                {
                  $addFields: {
                    last_connection: { $max: "$connection_history" },
                  },
                },
                {
                  $project: {
                    nom: 1,
                    prenom: 1,
                    email: 1,
                    telephone: 1,
                    fonction: 1,
                    last_connection: 1,
                  },
                },
              ],
              as: "cfa_users",
            },
          },
          {
            $addFields: {
              formationsCount: {
                $cond: {
                  if: { $isArray: "$organisme.relatedFormations" },
                  then: { $size: "$organisme.relatedFormations" },
                  else: 0,
                },
              },
            },
          },
          {
            $sort: buildSortFilter(sort, order, {
              nom: "organisme.nom",
              adresse: "organisme.adresse.commune",
              formations_count: "formationsCount",
            }),
          },
          { $skip: page * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              nom: "$organisme.nom",
              enseigne: "$organisme.enseigne",
              raison_sociale: "$organisme.raison_sociale",
              adresse: "$organisme.adresse",
              siret: "$organisme.siret",
              formations_count: "$formationsCount",
              users: "$cfa_users",
              inscrits: 1,
              abandons: 1,
              rupturants: 1,
              contacts_from_referentiel: "$organisme.contacts_from_referentiel",
            },
          },
        ],
        totalFormations: [
          {
            $lookup: {
              from: "organismes",
              localField: "_id",
              foreignField: "_id",
              as: "organisme",
            },
          },
          {
            $unwind: {
              path: "$organisme",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              formationsCount: {
                $cond: {
                  if: { $isArray: "$organisme.relatedFormations" },
                  then: { $size: "$organisme.relatedFormations" },
                  else: 0,
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalFormations: { $sum: "$formationsCount" },
            },
          },
        ],
      },
    },
    { $unwind: { path: "$pagination", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$totalFormations", preserveNullAndEmptyArrays: true } },
  ];
  const resultOrganismes = await effectifsDb().aggregate(organismeMissionLocaleAggregation).next();

  if (!resultOrganismes) {
    return { pagination: { total: 0, page, limit }, data: [], totalFormations: 0 };
  }

  const { pagination, data, totalFormations } = resultOrganismes;

  if (pagination) {
    pagination.lastPage = Math.ceil(pagination.total / limit);
  }

  return { pagination, data, totalFormations: totalFormations?.totalFormations || 0 };
};

/**
 * Liste les contacts (utilisateurs) liés à une Mission Locale
 * à partir de son identifiant `ml_id`.
 *
 * @param missionLocaleID Identifiant numérique de la Mission Locale (ml_id)
 * @returns La liste des utilisateurs confirmés rattachés à cette organisation
 */
export async function listContactsMlOrganisme(missionLocaleID: number) {
  const organisation = await organisationsDb().findOne({
    ml_id: missionLocaleID,
    type: "MISSION_LOCALE",
  });

  if (!organisation) {
    logger.warn(
      { module: "listContactsMlOrganisme", missionLocaleID },
      `Aucune organisation de type MISSION_LOCALE trouvée pour ml_id=${missionLocaleID}.`
    );
    return [];
  }

  const contacts = await usersMigrationDb()
    .find(
      {
        organisation_id: new ObjectId(organisation._id),
        account_status: "CONFIRMED",
      },
      {
        projection: {
          _id: 1,
          email: 1,
          nom: 1,
          prenom: 1,
          fonction: 1,
          telephone: 1,
          created_at: 1,
        },
      }
    )
    .toArray();

  return contacts;
}

export const getEffectifsParMoisByMissionLocaleId = async (
  missionLocaleId: number,
  missionLocaleMongoId: ObjectId,
  effectifsParMoisFiltersMissionLocale: IEffectifsParMoisFiltersMissionLocaleSchema
) => {
  const { type } = effectifsParMoisFiltersMissionLocale;

  const aTraiter = type === API_TRAITEMENT_TYPE.A_TRAITER;

  const statut = [STATUT_APPRENANT.RUPTURANT];
  const organismeMissionLocaleAggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    ...effectifMissionLocaleLookupAggregation(missionLocaleMongoId),
    {
      $addFields: {
        firstDayOfMonth: {
          $dateFromParts: {
            year: { $year: "$dernierStatut.date" },
            month: { $month: "$dernierStatut.date" },
          },
        },
      },
    },
    {
      $group: {
        _id: "$firstDayOfMonth",
        truc: {
          $push: "$$ROOT"
        },
        data: {
          $push: {
            "$cond": [
              {
                $eq: ['$$ROOT.a_traiter', aTraiter]
              },
              {
                id: "$$ROOT._id",
                nom: "$$ROOT.apprenant.nom",
                prenom: "$$ROOT.apprenant.prenom",
                libelle_formation: "$$ROOT.formation.libelle_long",
              },
              null
            ],
            
          },
        },
         ... (aTraiter ? {
            treated_count: {
            $sum: {
              $cond: [
                {
                  $eq: ['$$ROOT.a_traiter', false]
                },
                1, 
                0
              ]
            }
          }
        } : {}),
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        treated_count: 1,
        data: {
          $setDifference: [
            "$data",
            [null]
          ]
        },
      },
    },
  ];

  const effectifs = await effectifsDb().aggregate(organismeMissionLocaleAggregation).toArray();
  return { type, data: effectifs };
};

export const getEffectifFromMissionLocaleId = async (
  missionLocaleId: number,
  missionLocaleMongoId: ObjectId,
  effectifId: string
) => {
  const aggregation = [
    ...generateUnionWithEffectifDECA(missionLocaleId),
    {
      $match: {
        _id: new ObjectId(effectifId),
      },
    },
    ...effectifMissionLocaleLookupAggregation(missionLocaleMongoId),
    ...createDernierStatutFieldPipeline(new Date()),
    {
      $project: {
        nom: "$apprenant.nom",
        prenom: "$apprenant.prenom",
        date_de_naissance: "$apprenant.date_de_naissance",
        adresse: 1,
        formation: 1,
        courriel: "$apprenant.courriel",
        telephone: "$apprenant.telephone",
        responsable_mail: "$apprenant.responsable_apprenant_mail1",
        rqth: "$apprenant.rqth",
        form_effectif: "$ml_effectif",
        a_traiter: "$a_traiter",
        transmitted_at: "$transmitted_at",
        dernier_statut: "$dernierStatut",
      },
    },
  ];

  const effectif = await effectifsDb().aggregate(aggregation).next();

  if (!effectif) {
    throw Boom.notFound();
  }
  return effectif;
};
