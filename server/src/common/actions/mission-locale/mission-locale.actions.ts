import type { IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import { ObjectId } from "bson";
import { WithoutId } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffectif, IStatutApprenantEnum } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { API_TRAITEMENT_TYPE, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { IEffectifsParMoisFiltersMissionLocaleSchema } from "shared/models/routes/mission-locale/missionLocale.api";
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

const createDernierStatutFieldPipeline = (date: Date) => [
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
  statut.length ? [...createDernierStatutFieldPipeline(date), matchDernierStatutPipelineMl(statut)] : [];

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
  const A_TRAITER_CONDIITON = {
    $or: [
      { $eq: ["$situation", "$$REMOVE"] },
      {
        $in: ["$situation", [SITUATION_ENUM.A_CONTACTER]],
      },
    ],
  };

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

export const getEffectifsParMoisByMissionLocaleId = async (
  missionLocaleId: number,
  missionLocaleMongoId: ObjectId,
  effectifsParMoisFiltersMissionLocale: IEffectifsParMoisFiltersMissionLocaleSchema
) => {
  const { type } = effectifsParMoisFiltersMissionLocale;

  const aTraiter = type === API_TRAITEMENT_TYPE.A_TRAITER;

  const getFirstDayOfPreviousSixMonths = () => {
    const dates: string[] = [];
    const today: Date = new Date();

    for (let i = 0; i < 6; i++) {
      const date: Date = new Date(Date.UTC(today.getFullYear(), today.getMonth() - i, 1));
      const formatted: string = date.toISOString();
      dates.push(formatted);
    }

    return dates;
  };

  const statut = [STATUT_APPRENANT.RUPTURANT];
  const organismeMissionLocaleAggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(statut as any, new Date()),
    ...addFieldTraitementStatus(),
    {
      $match: {
        "dernierStatut.date": { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
      },
    },
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
                id: "$$ROOT._id",
                nom: "$$ROOT.effectif_snapshot.apprenant.nom",
                prenom: "$$ROOT.effectif_snapshot.apprenant.prenom",
                libelle_formation: "$$ROOT.effectif_snapshot.formation.libelle_long",
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
  ];

  const effectifs = await missionLocaleEffectifsDb().aggregate(organismeMissionLocaleAggregation).toArray();
  const formattedData = getFirstDayOfPreviousSixMonths().map((date) => {
    const found = effectifs.find(({ month }) => new Date(month).getTime() === new Date(date).getTime());
    return (
      found ?? {
        month: date,
        ...(aTraiter ? { treated_count: 0 } : {}),
        data: [],
      }
    );
  });
  return { type, data: formattedData };
};

export const getEffectifFromMissionLocaleId = async (
  missionLocaleId: number,
  missionLocaleMongoId: ObjectId,
  effectifId: string
) => {
  const aggregation = [
    // ...generateUnionWithEffectifDECA(missionLocaleId),
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    {
      $match: {
        "effectif_snapshot._id": new ObjectId(effectifId),
      },
    },
    ...addFieldTraitementStatus(),
    ...createDernierStatutFieldPipeline(new Date()),
    {
      $lookup: {
        from: "organismes",
        let: { id: "$effectif_snapshot.organisme_id" },
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
    {
      $project: {
        nom: "$effectif_snapshot.apprenant.nom",
        prenom: "$effectif_snapshot.apprenant.prenom",
        date_de_naissance: "$effectif_snapshot.apprenant.date_de_naissance",
        adresse: "$effectif_snapshot.adresse",
        formation: "$effectif_snapshot.formation",
        courriel: "$effectif_snapshot.apprenant.courriel",
        telephone: "$effectif_snapshot.apprenant.telephone",
        responsable_mail: "$effectif_snapshot.apprenant.responsable_apprenant_mail1",
        rqth: "$effectif_snapshot.apprenant.rqth",
        //form_effectif: "$effectif_snapshot.ml_effectif", TODO
        a_traiter: "$effectif_snapshot.a_traiter",
        transmitted_at: "$effectif_snapshot.transmitted_at",
        dernier_statut: "$dernierStatut",
        organisme: "$organisme",
        contrats: "$effectif_snapshot.contrats",
      },
    },
  ];
  const effectif = await missionLocaleEffectifsDb().aggregate(aggregation).next();

  if (!effectif) {
    throw Boom.notFound();
  }
  return effectif;
};

export const getEffectifsListByMisisonLocaleId = (
  missionLocaleId: number,
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
    {
      $lookup: {
        from: "organismes",
        localField: "organisme_id",
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
      $project: {
        nom: "$apprenant.nom",
        prenom: "$apprenant.prenom",
        transmitted_at: "$transmitted_at",
        source: "$source",
        contrat_date_debut: {
          $getField: {
            field: "date_debut",
            input: {
              $last: "$contrats",
            },
          },
        },
        contrat_date_rupture: {
          $getField: {
            field: "date_rupture",
            input: {
              $last: "$contrats",
            },
          },
        },
        contrat_date_fin: {
          $getField: {
            field: "date_fin",
            input: {
              $last: "$contrats",
            },
          },
        },
        date_de_naissance: "$apprenant.date_de_naissance",
        age: "$apprenant.age",
        rqth: "$apprenant.rqth",
        commune: "$apprenant.adresse.commune",
        code_postal: "$apprenant.adresse.code_postal",
        telephone: "$apprenant.telephone",
        email: "$apprenant.courriel",
        email_responsable_1: "$apprenant.responsable_mail1",
        email_responsable_2: "$apprenant.responsable_mail2",
        libelle_formation: "$formation.libelle_long",
        organisme_nom: "$organisme.nom",
        organisme_code_postal: "$organisme.adresse.code_postal",
      },
    },
  ];

  return missionLocaleEffectifsDb().aggregate(effectifsMissionLocaleAggregation).toArray();
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

export const createMissionLocaleSnapshot = async (
  effectif: WithoutId<IEffectif> | WithoutId<IEffectifDECA>,
  id: ObjectId
) => {
  const ageFilter =
    effectif?.apprenant?.date_de_naissance >= new Date(new Date().setFullYear(new Date().getFullYear() - 26));
  const rqthFilter = effectif.apprenant.rqth;
  const rupturantFilter = effectif._computed?.statut?.en_cours === "RUPTURANT";
  const mlFilter = !!effectif.apprenant.adresse?.mission_locale_id;

  if (mlFilter && rupturantFilter && (ageFilter || rqthFilter)) {
    const mlData = await organisationsDb().findOne({
      type: "MISSION_LOCALE",
      ml_id: effectif.apprenant.adresse?.mission_locale_id,
    });
    if (mlData) {
      missionLocaleEffectifsDb().findOneAndUpdate(
        {
          mission_locale_id: mlData?._id,
          effectif_id: id,
        },
        {
          $setOnInsert: {
            effectif_snapshot: { ...effectif, _id: id },
            effectif_snapshot_date: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }
};
