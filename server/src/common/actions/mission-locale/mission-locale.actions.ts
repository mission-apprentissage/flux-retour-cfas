import type { IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import { ObjectId } from "bson";
import { AggregationCursor } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffectif, IUpdateMissionLocaleEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { API_TRAITEMENT_TYPE } from "shared/models/data/missionLocaleEffectif.model";
import { IEffectifsParMoisFiltersMissionLocaleSchema } from "shared/models/routes/mission-locale/missionLocale.api";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";

import { createDernierStatutFieldPipeline } from "../indicateurs/indicateurs.actions";

/**
 *    EffectifsDb
 */

const unionWithDecaForMissionLocale = (missionLocaleId: number) => [
  {
    $unionWith: {
      coll: "effectifsDECA",
      pipeline: [{ $match: { is_deca_compatible: true } }],
    },
  },
  {
    $match: {
      $or: [
        {
          "apprenant.date_de_naissance": {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 26)),
          },
        },
        { "apprenant.rqth": true },
      ],
    },
  },
  {
    $match: {
      "apprenant.adresse.mission_locale_id": missionLocaleId,
      annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
    },
  },
];

export const getAllEffectifForMissionLocaleCursor = (
  mission_locale_id: number
): AggregationCursor<IEffectif | IEffectifDECA> => {
  const statut = [STATUT_APPRENANT.RUPTURANT];

  const effectifsMissionLocaleAggregation = [
    ...unionWithDecaForMissionLocale(mission_locale_id),
    ...createDernierStatutFieldPipeline(new Date()),
    matchDernierStatutPipelineMl(statut),
    {
      $unset: ["dernierStatutDureeInDay", "dernierStatut"],
    },
  ];

  return effectifsDb().aggregate(effectifsMissionLocaleAggregation);
};

/**
 *    MissionLocaleEffectifDb
 */

/**
 * Filtre constant pour les missions locales
 */
const EFF_MISSION_LOCALE_FILTER = [
  {
    $match: {
      $or: [
        {
          "effectif_snapshot.apprenant.date_de_naissance": {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 26)),
          },
        },
        { "effectif_snapshot.apprenant.rqth": true },
      ],
    },
  },
];

const createDernierStatutFieldPipelineML = (date: Date) => [
  {
    $addFields: {
      dernierStatut: {
        $arrayElemAt: [
          {
            $filter: {
              input: "$effectif_snapshot._computed.statut.parcours",
              as: "statut",
              cond: {
                $lte: ["$$statut.date", date],
              },
            },
          },
          -1,
        ],
      },
    },
  },
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$dernierStatut.date", endDate: date, unit: "day" },
      },
    },
  },
];

/**
 * Application des filtres sur les dernier statut en fonction de la liste de statut et de la date
 * @param statut Liste des status a filtrer
 * @param date Date de calcul du filtre
 * @returns Une liste de addFields et de match
 */
const filterByDernierStatutPipelineMl = (statut: Array<StatutApprenant>, date: Date) =>
  statut.length ? [...createDernierStatutFieldPipelineML(date), matchDernierStatutPipelineMl(statut)] : [];

const matchTraitementEffectifPipelineMl = (type: API_TRAITEMENT_TYPE) => {
  return [
    {
      $match: {
        a_traiter: type === API_TRAITEMENT_TYPE.A_TRAITER,
      },
    },
  ];
};
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
 * Création du filtre sur la mission locale concerné
 * @param missionLocaleId Id de la mission locale
 * @returns Objet match
 */
const generateMissionLocaleMatchStage = (missionLocaleId: ObjectId) => {
  return {
    $match: {
      mission_locale_id: missionLocaleId,
      "effectif_snapshot.annee_scolaire": { $in: getAnneesScolaireListFromDate(new Date()) },
    },
  };
};

const addFieldTraitementStatus = () => {
  const A_TRAITER_CONDIITON = { $eq: ["$situation", "$$REMOVE"] };

  return [
    {
      $addFields: {
        a_traiter: {
          $cond: [A_TRAITER_CONDIITON, true, false],
        },
      },
    },
  ];
};

const lookUpOrganisme = (withContacts: boolean = false) => {
  return [
    {
      $lookup: {
        from: "organismes",
        let: { id: "$effectif_snapshot.organisme_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: withContacts ? 1 : 0,
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
    ...(withContacts
      ? [
          {
            $lookup: {
              from: "organisations",
              let: { id: { $toString: "$organisme._id" } },
              pipeline: [
                { $match: { type: "ORGANISME_FORMATION" } },
                { $match: { $expr: { $eq: ["$organisme_id", "$$id"] } } },
                {
                  $project: {
                    _id: 1,
                  },
                },
              ],
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
              let: { id: "$organisation._id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$organisation_id", "$$id"] } } },
                {
                  $project: {
                    _id: 0,
                    email: 1,
                    telephone: 1,
                    nom: 1,
                    prenom: 1,
                    fonction: 1,
                  },
                },
              ],
              as: "tdb_users",
            },
          },
        ]
      : []),
  ];
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

const getEffectifsIdSortedByMonthAndRuptureDateByMissionLocaleId = async (
  missionLocaleMongoId: ObjectId,
  aTraiter: boolean,
  effectifId: ObjectId
) => {
  const statut = [STATUT_APPRENANT.RUPTURANT];
  const aggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    ...addFieldTraitementStatus(),
    {
      $match: {
        a_traiter: aTraiter,
      },
    },
    {
      $sort: {
        "dernierStatut.date": -1,
      },
    },
    {
      $project: {
        _id: 0,
        id: "$effectif_snapshot._id",
        nom: "$effectif_snapshot.apprenant.nom",
        prenom: "$effectif_snapshot.apprenant.prenom",
      },
    },
  ];

  const effectifs = await missionLocaleEffectifsDb().aggregate(aggregation).toArray();
  const index = effectifs.findIndex(({ id }) => id.toString() === effectifId.toString());

  // modulo qui gère les valeurs négatives
  const modulo = (a, b) => ((a % b) + b) % b;

  // Si il n'y a qu'un seul element, pas de next
  return index >= 0 && effectifs.length > 1
    ? {
        total: effectifs.length,
        next: effectifs[modulo(index + 1, effectifs.length)],
        previous: effectifs[modulo(index - 1, effectifs.length)],
        currentIndex: index,
      }
    : {
        total: effectifs.length,
        next: null,
        previous: null,
        currentIndex: null,
      };
};

export const getEffectifsParMoisByMissionLocaleId = async (
  missionLocaleMongoId: ObjectId,
  effectifsParMoisFiltersMissionLocale: IEffectifsParMoisFiltersMissionLocaleSchema
) => {
  const { type } = effectifsParMoisFiltersMissionLocale;

  const aTraiter = type === API_TRAITEMENT_TYPE.A_TRAITER;

  const getFirstDayOfMonthListFromDate = (firstDate: Date | null) => {
    if (!firstDate) {
      return [];
    }

    const dates: string[] = [];
    const today: Date = new Date();
    const targetDate = new Date(Date.UTC(firstDate.getFullYear(), firstDate.getMonth(), 1));
    let done = false;
    let i = 0;

    while (!done) {
      const date: Date = new Date(Date.UTC(today.getFullYear(), today.getMonth() - i, 1));
      const formatted: string = date.toISOString();
      done = date <= targetDate;
      dates.push(formatted);
      i++;
    }

    return dates;
  };

  const statut = [STATUT_APPRENANT.RUPTURANT];
  const organismeMissionLocaleAggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    ...addFieldTraitementStatus(),
    ...(aTraiter // Si a traiter = true, alors pas de match sur le statut de traiement afin de pouvoir grouper par traitement ( treated_count )
      ? []
      : [
          {
            $match: {
              a_traiter: aTraiter,
            },
          },
        ]),
    {
      $sort: {
        "dernierStatut.date": -1,
      },
    },
    ...lookUpOrganisme(),
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
          $push: "$$ROOT",
        },
        data: {
          $push: {
            $cond: [
              {
                $eq: ["$$ROOT.a_traiter", aTraiter],
              },
              {
                id: "$$ROOT.effectif_snapshot._id",
                nom: "$$ROOT.effectif_snapshot.apprenant.nom",
                prenom: "$$ROOT.effectif_snapshot.apprenant.prenom",
                libelle_formation: "$$ROOT.effectif_snapshot.formation.libelle_long",
                organisme_nom: "$$ROOT.organisme.nom",
                organisme_raison_sociale: "$$ROOT.organisme.raison_sociale",
                organisme_enseigne: "$$ROOT.organisme.enseigne",
              },
              null,
            ],
          },
        },
        ...(aTraiter
          ? {
              treated_count: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$$ROOT.a_traiter", false],
                    },
                    1,
                    0,
                  ],
                },
              },
            }
          : {}),
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        treated_count: 1,
        data: {
          $setDifference: ["$data", [null]],
        },
      },
    },
    {
      $sort: {
        month: -1,
      },
    },
  ];

  const effectifs = await missionLocaleEffectifsDb().aggregate(organismeMissionLocaleAggregation).toArray();

  const oldestMonth = effectifs && effectifs.length ? effectifs.slice(-1)[0].month : null;
  const formattedData = aTraiter
    ? getFirstDayOfMonthListFromDate(oldestMonth).map((date) => {
        const found = effectifs.find(({ month }) => new Date(month).getTime() === new Date(date).getTime());
        return (
          found ?? {
            month: date,
            ...(aTraiter ? { treated_count: 0 } : {}),
            data: [],
          }
        );
      })
    : effectifs.sort((a, b) => b.month - a.month);
  return formattedData;
};

export const getEffectifFromMissionLocaleId = async (missionLocaleMongoId: ObjectId, effectifId: string) => {
  const aggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    {
      $match: {
        "effectif_snapshot._id": new ObjectId(effectifId),
      },
    },
    ...addFieldTraitementStatus(),
    ...createDernierStatutFieldPipelineML(new Date()),
    ...lookUpOrganisme(true),
    {
      $project: {
        id: "$effectif_snapshot._id",
        nom: "$effectif_snapshot.apprenant.nom",
        prenom: "$effectif_snapshot.apprenant.prenom",
        date_de_naissance: "$effectif_snapshot.apprenant.date_de_naissance",
        adresse: "$effectif_snapshot.apprenant.adresse",
        formation: "$effectif_snapshot.formation",
        courriel: "$effectif_snapshot.apprenant.courriel",
        telephone: "$effectif_snapshot.apprenant.telephone",
        responsable_mail: "$effectif_snapshot.apprenant.responsable_mail1",
        rqth: "$effectif_snapshot.apprenant.rqth",
        a_traiter: "$a_traiter",
        transmitted_at: "$effectif_snapshot.transmitted_at",
        source: "$effectif_snapshot.source",
        dernier_statut: "$dernierStatut",
        organisme: "$organisme",
        contrats: "$effectif_snapshot.contrats",
        "situation.situation": "$situation",
        "situation.situation_autre": "$situation_autre",
        "situation.deja_connu": "$deja_connu",
        "situation.commentaires": "$commentaires",
        contacts_tdb: "$tdb_users",
      },
    },
  ];

  const effectif = await missionLocaleEffectifsDb().aggregate(aggregation).next();

  if (!effectif) {
    throw Boom.notFound();
  }

  const next = await getEffectifsIdSortedByMonthAndRuptureDateByMissionLocaleId(
    missionLocaleMongoId,
    effectif.a_traiter,
    new ObjectId(effectifId)
  );
  return { effectif, ...next };
};

export const getEffectifsListByMisisonLocaleId = (
  missionLocaleMongoId: ObjectId,
  effectifsParMoisFiltersMissionLocale: IEffectifsParMoisFiltersMissionLocaleSchema
) => {
  const statut = [STATUT_APPRENANT.RUPTURANT];
  const { type } = effectifsParMoisFiltersMissionLocale;

  const effectifsMissionLocaleAggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    ...addFieldTraitementStatus(),
    ...matchTraitementEffectifPipelineMl(type),
    ...lookUpOrganisme(true),
    {
      $project: {
        nom: "$effectif_snapshot.apprenant.nom",
        prenom: "$effectif_snapshot.apprenant.prenom",
        transmitted_at: "$effectif_snapshot.transmitted_at",
        source: "$effectif_snapshot.source",
        contrat_date_debut: {
          $getField: {
            field: "date_debut",
            input: {
              $last: "$effectif_snapshot.contrats",
            },
          },
        },
        contrat_date_rupture: {
          $getField: {
            field: "date_rupture",
            input: {
              $last: "$effectif_snapshot.contrats",
            },
          },
        },
        contrat_date_fin: {
          $getField: {
            field: "date_fin",
            input: {
              $last: "$effectif_snapshot.contrats",
            },
          },
        },
        date_de_naissance: "$effectif_snapshot.apprenant.date_de_naissance",
        rqth: "$effectif_snapshot.apprenant.rqth",
        commune: "$effectif_snapshot.apprenant.adresse.commune",
        code_postal: "$effectif_snapshot.apprenant.adresse.code_postal",
        telephone: "$effectif_snapshot.apprenant.telephone",
        email: "$effectif_snapshot.apprenant.courriel",
        email_responsable_1: "$effectif_snapshot.apprenant.responsable_mail1",
        email_responsable_2: "$effectif_snapshot.apprenant.responsable_mail2",
        libelle_formation: "$effectif_snapshot.formation.libelle_long",
        organisme_nom: "$organisme.nom",
        organisme_code_postal: "$organisme.adresse.code_postal",
        organisme_contacts: "$organisme.contacts_from_referentiel",
        tdb_organisme_contacts: "$tdb_users",
      },
    },
  ];

  return missionLocaleEffectifsDb().aggregate(effectifsMissionLocaleAggregation).toArray();
};

export const setEffectifMissionLocaleData = async (
  missionLocaleId: ObjectId,
  effectifId: ObjectId,
  data: IUpdateMissionLocaleEffectif
) => {
  const { situation, situation_autre, commentaires, deja_connu } = data;

  const setObject = {
    situation,
    deja_connu,
    ...(situation_autre !== undefined ? { situation_autre } : {}),
    ...(commentaires !== undefined ? { commentaires } : {}),
  };

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(effectifId),
    },
    {
      $set: {
        ...setObject,
        updated_at: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return updated;
};

export const createMissionLocaleSnapshot = async (effectif: IEffectif | IEffectifDECA) => {
  const ageFilter = effectif?.apprenant?.date_de_naissance
    ? effectif?.apprenant?.date_de_naissance >= new Date(new Date().setFullYear(new Date().getFullYear() - 26))
    : false;
  const rqthFilter = effectif.apprenant.rqth;
  const rupturantFilter = effectif._computed?.statut?.en_cours === "RUPTURANT";
  const mlFilter = !!effectif.apprenant.adresse?.mission_locale_id;

  if (mlFilter && rupturantFilter && (ageFilter || rqthFilter)) {
    const mlData = await organisationsDb().findOne({
      type: "MISSION_LOCALE",
      ml_id: effectif.apprenant.adresse?.mission_locale_id,
    });

    if (mlData) {
      await missionLocaleEffectifsDb().findOneAndUpdate(
        {
          mission_locale_id: mlData?._id,
          effectif_id: effectif._id,
        },
        {
          $setOnInsert: {
            effectif_snapshot: { ...effectif, _id: effectif._id },
            effectif_snapshot_date: new Date(),
            created_at: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }
};
