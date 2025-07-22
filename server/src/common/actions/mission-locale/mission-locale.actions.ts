import type { IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import { ObjectId } from "bson";
import { AggregationCursor } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif, IOrganisationMissionLocale, IUpdateMissionLocaleEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import {
  IEmailStatusEnum,
  API_EFFECTIF_LISTE,
  SITUATION_ENUM,
  zEmailStatusEnum,
} from "shared/models/data/missionLocaleEffectif.model";
import { IMissionLocaleStats } from "shared/models/data/missionLocaleStats.model";
import { IEffectifsParMoisFiltersMissionLocaleSchema } from "shared/models/routes/mission-locale/missionLocale.api";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { v4 as uuidv4 } from "uuid";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";
import config from "@/config";

import { createDernierStatutFieldPipeline } from "../indicateurs/indicateurs.actions";

import { createOrUpdateMissionLocaleStats } from "./mission-locale-stats.actions";
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
  const effectifsMissionLocaleAggregation = [
    ...unionWithDecaForMissionLocale(mission_locale_id),
    ...createDernierStatutFieldPipeline(new Date()),
    matchDernierStatutPipelineMl(),
    {
      $unset: ["dernierStatutDureeInDay"],
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
      soft_deleted: { $ne: true },
      "effectif_snapshot.apprenant.date_de_naissance": {
        $lte: new Date(new Date().setFullYear(new Date().getFullYear() - 16)),
      },
    },
  },
];

const matchTraitementEffectifPipelineMl = (nom_liste: API_EFFECTIF_LISTE) => {
  switch (nom_liste) {
    case API_EFFECTIF_LISTE.PRIORITAIRE:
      return [
        {
          $match: {
            $and: [
              { a_traiter: true },
              { $or: [{ a_contacter: true }, { $and: [{ a_risque: true }, { statusChanged: false }] }] },
            ],
          },
        },
      ];
    case API_EFFECTIF_LISTE.INJOIGNABLE:
      return [
        {
          $match: {
            a_traiter: false,
            injoignable: true,
          },
        },
      ];
    case API_EFFECTIF_LISTE.A_TRAITER:
      return [
        {
          $match: {
            a_traiter: true,
          },
        },
      ];
    case API_EFFECTIF_LISTE.TRAITE:
      return [
        {
          $match: {
            a_traiter: false,
            injoignable: false,
          },
        },
      ];
  }
};

const createDernierStatutFieldPipelineML = () => [
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$date_rupture", endDate: new Date(), unit: "day" },
      },
    },
  },
  {
    $addFields: {
      statusChanged: {
        $cond: [{ $ne: ["$effectif_snapshot._computed.statut.en_cours", "$current_status.value"] }, true, false],
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
const filterByDernierStatutPipelineMl = () => {
  return [...createDernierStatutFieldPipelineML(), matchDernierStatutPipelineMl()];
};

const filterByActivationDatePipelineMl = () => {
  return [
    {
      $match: {
        in_activation_range: true,
      },
    },
  ];
};

/**
 * Création du match sur les dernier statuts
 * @param statut Liste de statuts à matcher
 * @returns Un obet match
 */
const matchDernierStatutPipelineMl = (): any => {
  const match = {
    $match: {
      "effectif_snapshot._computed.statut.en_cours": STATUT_APPRENANT.RUPTURANT,
      date_rupture: { $lte: Date.now() },
    },
  };
  return match;
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
const addFieldFromActivationDate = (mlActivationDate?: Date) => {
  let thresholdDate: Date | null = null;

  if (!mlActivationDate) {
    return [
      {
        $addFields: {
          in_activation_range: true,
        },
      },
    ];
  }

  thresholdDate = new Date(mlActivationDate);
  thresholdDate.setDate(thresholdDate.getDate() - 180);

  const IN_ACTIVATION_RANGE_CONDITION = {
    $gte: ["$date_rupture", thresholdDate],
  };

  return [
    {
      $addFields: {
        in_activation_range: {
          $cond: [IN_ACTIVATION_RANGE_CONDITION, true, false],
        },
      },
    },
  ];
};

const addFieldTraitementStatus = () => {
  const A_TRAITER_CONDIITON = { $eq: ["$situation", "$$REMOVE"] };
  const A_CONTACTER_CONDITION = { $eq: ["$effectif_choice.confirmation", true] };
  const A_RISQUE_CONDITION = {
    $and: [
      {
        $or: [
          { $eq: ["$effectif_snapshot.apprenant.rqth", true] },
          {
            $and: [
              {
                $gte: [
                  "$effectif_snapshot.apprenant.date_de_naissance",
                  new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
                ],
              },
              {
                $lte: [
                  "$effectif_snapshot.apprenant.date_de_naissance",
                  new Date(new Date().setFullYear(new Date().getFullYear() - 16)),
                ],
              },
            ],
          },
        ],
      },
      {
        $eq: ["$current_status.value", STATUT_APPRENANT.RUPTURANT],
      },
    ],
  };

  const INJOIGNABLE_CONDITION = {
    $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR],
  };

  return [
    {
      $addFields: {
        a_traiter: {
          $cond: [A_TRAITER_CONDIITON, true, false],
        },
        a_risque: {
          $cond: [A_RISQUE_CONDITION, true, false],
        },
        injoignable: {
          $cond: [INJOIGNABLE_CONDITION, true, false],
        },
        a_contacter: {
          $cond: [A_CONTACTER_CONDITION, true, false],
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
    email: (ml.contact.email ?? "").toLowerCase(),
    telephone: ml.contact.telephone ?? "",
    site_web: (ml.contact.siteWeb ?? "").toLowerCase(),
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
  effectifId: ObjectId,
  nom_liste: API_EFFECTIF_LISTE,
  missionLocaleActivationDate?: Date
) => {
  const aggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(),
    ...addFieldFromActivationDate(missionLocaleActivationDate),
    ...filterByActivationDatePipelineMl(),
    ...addFieldTraitementStatus(),
    ...matchTraitementEffectifPipelineMl(nom_liste),
    {
      $sort: {
        date_rupture: -1,
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
        nomListe: nom_liste,
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
  effectifsParMoisFiltersMissionLocale: IEffectifsParMoisFiltersMissionLocaleSchema,
  missionLocaleActivationDate?: Date
) => {
  const { type } = effectifsParMoisFiltersMissionLocale;

  const aTraiter = type === API_EFFECTIF_LISTE.A_TRAITER;
  const traite = type === API_EFFECTIF_LISTE.TRAITE;
  const injoignable = type === API_EFFECTIF_LISTE.INJOIGNABLE;

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

  const organismeMissionLocaleAggregation: any[] = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(),
    ...addFieldFromActivationDate(missionLocaleActivationDate),
    ...addFieldTraitementStatus(),
  ];

  if (traite) {
    organismeMissionLocaleAggregation.push({
      $match: {
        a_traiter: false,
        injoignable: false,
      },
    });
  } else if (injoignable) {
    organismeMissionLocaleAggregation.push({
      $match: {
        injoignable: true,
      },
    });
  }

  organismeMissionLocaleAggregation.push(
    {
      $sort: {
        date_rupture: -1,
      },
    },
    ...lookUpOrganisme(),
    {
      $addFields: {
        firstDayOfMonth: {
          $dateFromParts: {
            year: { $year: "$date_rupture" },
            month: { $month: "$date_rupture" },
          },
        },
      },
    },
    {
      $group: {
        _id: "$firstDayOfMonth",
        data: {
          $push: {
            $cond: [
              {
                $and: [{ $eq: ["$$ROOT.a_traiter", aTraiter] }, { $eq: ["$$ROOT.in_activation_range", true] }],
              },
              {
                id: "$$ROOT.effectif_snapshot._id",
                nom: "$$ROOT.effectif_snapshot.apprenant.nom",
                prenom: "$$ROOT.effectif_snapshot.apprenant.prenom",
                libelle_formation: "$$ROOT.effectif_snapshot.formation.libelle_long",
                organisme_nom: "$$ROOT.organisme.nom",
                organisme_raison_sociale: "$$ROOT.organisme.raison_sociale",
                organisme_enseigne: "$$ROOT.organisme.enseigne",
                prioritaire: "$a_risque",
                a_contacter: "$a_contacter",
              },
              null,
            ],
          },
        },
        ...(aTraiter
          ? {
              treated_count: {
                $sum: {
                  $cond: [{ $eq: ["$$ROOT.a_traiter", false] }, 1, 0],
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
    }
  );

  const result = await missionLocaleEffectifsDb().aggregate(organismeMissionLocaleAggregation).toArray();

  const oldestRealDataIndex = result.findLastIndex(
    ({ treated_count, data }) => (treated_count ?? 0) > 0 || data.length > 0
  );
  const effectifs = oldestRealDataIndex >= 0 ? result.slice(0, oldestRealDataIndex + 1) : [...result];

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

export const getEffectifFromMissionLocaleId = async (
  missionLocaleMongoId: ObjectId,
  effectifId: string,
  nom_liste: API_EFFECTIF_LISTE,
  missionLocaleActivationDate?: Date
) => {
  const aggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    {
      $match: {
        "effectif_snapshot._id": new ObjectId(effectifId),
      },
    },
    ...addFieldTraitementStatus(),
    ...createDernierStatutFieldPipelineML(),
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
        telephone_corrected: "$effectif_choice.telephone",
        autorisation_contact: "$effectif_choice.confirmation",
        responsable_mail: "$effectif_snapshot.apprenant.responsable_mail1",
        rqth: "$effectif_snapshot.apprenant.rqth",
        a_traiter: "$a_traiter",
        injoignable: "$injoignable",
        transmitted_at: "$effectif_snapshot.transmitted_at",
        source: "$effectif_snapshot.source",
        date_rupture: "$date_rupture",
        organisme: "$organisme",
        contrats: "$effectif_snapshot.contrats",
        "situation.situation": "$situation",
        "situation.situation_autre": "$situation_autre",
        "situation.deja_connu": "$deja_connu",
        "situation.commentaires": "$commentaires",
        contacts_tdb: "$tdb_users",
        prioritaire: "$a_risque",
        a_contacter: "$a_contacter",
        current_status: "$current_status",
      },
    },
  ];

  const effectif = await missionLocaleEffectifsDb().aggregate(aggregation).next();

  if (!effectif) {
    throw Boom.notFound();
  }

  const next = await getEffectifsIdSortedByMonthAndRuptureDateByMissionLocaleId(
    missionLocaleMongoId,
    new ObjectId(effectifId),
    nom_liste,
    missionLocaleActivationDate
  );
  return { effectif, ...next };
};

export const getEffectifsListByMisisonLocaleId = (
  missionLocaleMongoId: ObjectId,
  effectifsParMoisFiltersMissionLocale: IEffectifsParMoisFiltersMissionLocaleSchema,
  missionLocaleActivationDate?: Date
) => {
  const { type } = effectifsParMoisFiltersMissionLocale;

  const effectifsMissionLocaleAggregation = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(),
    ...addFieldFromActivationDate(missionLocaleActivationDate),
    ...filterByActivationDatePipelineMl(),
    ...addFieldTraitementStatus(),
    ...matchTraitementEffectifPipelineMl(type),
    ...lookUpOrganisme(true),
    {
      $addFields: {
        _effectif_choice_label: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [{ $eq: ["$effectif_choice", null] }, { $eq: ["$brevo", null] }],
                },
                then: "Non inclus dans la campagne",
              },
              {
                case: {
                  $and: [{ $eq: ["$effectif_choice", null] }, { $ne: ["$brevo", null] }],
                },
                then: "Pas de clic",
              },
              {
                case: { $eq: ["$effectif_choice.confirmation", true] },
                then: "Clic + souhaite un accompagnement",
              },
              {
                case: { $eq: ["$effectif_choice.confirmation", false] },
                then: "Clic + ne souhaite pas d'accompagnement",
              },
            ],
            default: "Non inclus dans la campagne",
          },
        },
      },
    },
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
        effectif_choice: "$_effectif_choice_label",
        ml_situation: "$situation",
        ml_deja_connu: "$deja_connu",
        ml_commentaires: "$commentaires",
        ml_situation_autre: "$situation_autre",
      },
    },
  ];

  return missionLocaleEffectifsDb().aggregate(effectifsMissionLocaleAggregation).toArray();
};

export const getEffectifARisqueByMissionLocaleId = async (missionLocaleMongoId: ObjectId) => {
  const pipeline = [
    generateMissionLocaleMatchStage(missionLocaleMongoId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(),
    ...addFieldTraitementStatus(),
    {
      $facet: {
        hadEffectifs: [
          {
            $match: {
              a_traiter: false,
              a_risque: true,
            },
          },
          { $limit: 1 },
        ],
        prioritaire: [
          {
            $match: {
              $and: [
                { a_traiter: true },
                { $or: [{ a_contacter: true }, { $and: [{ a_risque: true }, { statusChanged: false }] }] },
              ],
            },
          },
          {
            $sort: {
              date_rupture: -1,
            },
          },
          ...lookUpOrganisme(),
          {
            $project: {
              _id: 0,
              id: "$effectif_snapshot._id",
              nom: "$effectif_snapshot.apprenant.nom",
              prenom: "$effectif_snapshot.apprenant.prenom",
              libelle_formation: "$effectif_snapshot.formation.libelle_long",
              organisme_nom: "$organisme.nom",
              organisme_raison_sociale: "$organisme.raison_sociale",
              organisme_enseigne: "$organisme.enseigne",
              prioritaire: "$a_risque",
              date_rupture: "$date_rupture",
            },
          },
        ],
      },
    },
    {
      $project: {
        hadEffectifsPrioritaires: { $gt: [{ $size: "$hadEffectifs" }, 0] },
        effectifs: "$prioritaire",
      },
    },
  ];

  const [result] = await missionLocaleEffectifsDb().aggregate(pipeline).toArray();

  return result;
};

const getEffectifMissionLocaleEligibleToBrevoAggregation = (
  missionLocaleMongoId: ObjectId,
  missionLocaleActivationDate?: Date
) => [
  generateMissionLocaleMatchStage(missionLocaleMongoId),
  ...EFF_MISSION_LOCALE_FILTER,
  ...filterByDernierStatutPipelineMl(),
  ...addFieldFromActivationDate(missionLocaleActivationDate),
  ...filterByActivationDatePipelineMl(),
];

export const getEffectifMissionLocaleEligibleToBrevoCount = async (
  missionLocaleMongoId: ObjectId,
  missionLocaleActivationDate?: Date
) => {
  const effectifsMissionLocaleAggregation = [
    ...getEffectifMissionLocaleEligibleToBrevoAggregation(missionLocaleMongoId, missionLocaleActivationDate),

    {
      $facet: {
        total: [{ $count: "total" }],
        eligible: [
          { $match: { email_status: zEmailStatusEnum.enum.valid, "brevo.token": { $ne: null } } },
          { $count: "total" },
        ],
        details: [
          {
            $group: {
              _id: { $ifNull: ["$email_status", "not_processed"] },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $project: {
        total: { $arrayElemAt: ["$total.total", 0] },
        eligible: { $arrayElemAt: ["$eligible.total", 0] },
        details: 1,
      },
    },
  ];
  const data = await missionLocaleEffectifsDb().aggregate(effectifsMissionLocaleAggregation).next();
  return data;
};

export async function getAllEffectifsParMois(missionLocaleId: ObjectId, activationDate?: Date) {
  const fetchByType = (type: API_EFFECTIF_LISTE) =>
    getEffectifsParMoisByMissionLocaleId(
      missionLocaleId,
      { type } as IEffectifsParMoisFiltersMissionLocaleSchema,
      activationDate
    );

  const [a_traiter, traite, prioritaire, injoignable] = await Promise.all([
    fetchByType(API_EFFECTIF_LISTE.A_TRAITER),
    fetchByType(API_EFFECTIF_LISTE.TRAITE),
    getEffectifARisqueByMissionLocaleId(missionLocaleId),
    fetchByType(API_EFFECTIF_LISTE.INJOIGNABLE),
  ]);

  return { a_traiter, traite, prioritaire, injoignable };
}

// BAL

export const getEffectifMissionLocaleEligibleToBrevo = async (
  missionLocaleMongoId: ObjectId,
  missionLocaleActivationDate?: Date
) => {
  const effectifsMissionLocaleAggregation = [
    ...getEffectifMissionLocaleEligibleToBrevoAggregation(missionLocaleMongoId, missionLocaleActivationDate),
    {
      $match: {
        soft_deleted: { $ne: true },
        "brevo.token": { $ne: null },
      },
    },
    {
      $lookup: {
        from: "organisations",
        let: { id: "$mission_locale_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: 1,
              nom: 1,
              site_web: 1,
            },
          },
        ],
        as: "mission_locale",
      },
    },
    {
      $lookup: {
        from: "organismes",
        let: { id: "$effectif_snapshot.organisme_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: 1,
              nom: 1,
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
      $unwind: {
        path: "$mission_locale",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        email: "$effectif_snapshot.apprenant.courriel",
        nom: "$effectif_snapshot.apprenant.nom",
        prenom: "$effectif_snapshot.apprenant.prenom",
        "urls.TDB_AB_TEST_A": {
          $concat: [config.publicUrl, "/campagnes/mission-locale/", "$brevo.token"],
        },
        "urls.TDB_AB_TEST_B_TRUE": {
          $concat: [config.publicUrl, "/api/v1/campagne/mission-locale/", "$brevo.token", "/confirmation/true"],
        },
        "urls.TDB_AB_TEST_B_FALSE": {
          $concat: [config.publicUrl, "/api/v1/campagne/mission-locale/", "$brevo.token", "/confirmation/false"],
        },
        "urls.TDB_LBA_LINK": {
          $concat: [
            config.publicUrl,
            "/api/v1/mission-locale/lba?",
            "rncp=",
            "$effectif_snapshot.formation.rncp",
            "&cfd=",
            "$effectif_snapshot.formation.cfd",
          ],
        },
        "urls.TDB_MISSION_LOCALE_URL": "$mission_locale.site_web",
        telephone: "$effectif_snapshot.apprenant.telephone",
        nom_organisme: "$organisme.nom",
        nom_mission_locale: "$mission_locale.nom",
        mission_locale_id: { $toString: "$effectif_snapshot.apprenant.adresse.mission_locale_id" },
        date_de_naissance: "$effectif_snapshot.apprenant.date_de_naissance",
        date_derniere_rupture: "$date_rupture",
      },
    },
  ];
  const data = await missionLocaleEffectifsDb().aggregate(effectifsMissionLocaleAggregation).toArray();
  return data as Array<{
    email: string;
    prenom: string;
    nom: string;
    urls?: Record<string, string> | null;
    telephone?: string | null;
    nom_organisme?: string | null;
    mission_locale_id: string;
    nom_mission_locale: string;
    date_de_naissance?: Date | null;
    date_derniere_rupture?: Date | null;
  }>;
};

export const getMissionLocaleRupturantToCheckMail = async (): Promise<Array<string>> => {
  return (
    await missionLocaleEffectifsDb()
      .aggregate([
        {
          $match: {
            email_status: { $exists: false },
          },
        },
        {
          $project: {
            _id: 0,
            email: "$effectif_snapshot.apprenant.courriel",
          },
        },
      ])
      .toArray()
  ).map(({ email }) => email) as Array<string>;
};

export const updateRupturantsWithMailInfo = async (rupturants: Array<{ email: string; status: IEmailStatusEnum }>) => {
  if (!rupturants || rupturants.length === 0) {
    return;
  }

  const bulkOps = rupturants.map(({ email, status }) => ({
    updateOne: {
      filter: { "effectif_snapshot.apprenant.courriel": email },
      update: { $set: { email_status: status } },
    },
  }));

  const result = await missionLocaleEffectifsDb().bulkWrite(bulkOps);
  return result;
};

export const updateOrDeleteMissionLocaleSnapshot = async (effectif: IEffectif | IEffectifDECA) => {
  const eff = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
  const rupturantFilter = effectif._computed?.statut?.en_cours === "RUPTURANT";

  if (eff) {
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: effectif._id },
      {
        $set: {
          ...(rupturantFilter ? {} : { soft_deleted: true }),
          effectif_snapshot: { ...effectif, _id: effectif._id },
          effectif_snapshot_date: new Date(),
          updated_at: new Date(),
        },
      }
    );
  }
};

export const computeMissionLocaleStats = async (
  missionLocaleId: ObjectId,
  missionLocaleActivationDate?: Date
): Promise<IMissionLocaleStats["stats"]> => {
  const mineurCondition = {
    $gte: [
      "$effectif_snapshot.apprenant.date_de_naissance",
      new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
    ],
  };
  const rqthCondition = { $eq: ["$effectif_snapshot.apprenant.rqth", true] };

  const effectifsMissionLocaleAggregation = [
    generateMissionLocaleMatchStage(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(),
    ...addFieldFromActivationDate(missionLocaleActivationDate),
    ...filterByActivationDatePipelineMl(),
    ...addFieldTraitementStatus(),
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        a_traiter: { $sum: { $cond: [{ $eq: ["$a_traiter", true] }, 1, 0] } },
        traite: { $sum: { $cond: [{ $eq: ["$a_traiter", false] }, 1, 0] } },
        rdv_pris: { $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.RDV_PRIS] }, 1, 0] } },
        nouveau_projet: { $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.NOUVEAU_PROJET] }, 1, 0] } },
        deja_accompagne: { $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.DEJA_ACCOMPAGNE] }, 1, 0] } },
        contacte_sans_retour: { $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }, 1, 0] } },
        coordonnees_incorrectes: {
          $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.COORDONNEES_INCORRECT] }, 1, 0] },
        },
        autre: { $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.AUTRE] }, 1, 0] } },
        deja_connu: { $sum: { $cond: ["$deja_connu", 1, 0] } },
        mineur: {
          $sum: {
            $cond: [mineurCondition, 1, 0],
          },
        },
        mineur_a_traiter: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$a_traiter", true] }] }, 1, 0],
          },
        },
        mineur_traite: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$a_traiter", false] }] }, 1, 0],
          },
        },
        mineur_rdv_pris: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$situation", SITUATION_ENUM.RDV_PRIS] }] }, 1, 0],
          },
        },
        mineur_nouveau_projet: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$situation", SITUATION_ENUM.NOUVEAU_PROJET] }] }, 1, 0],
          },
        },
        mineur_deja_accompagne: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$situation", SITUATION_ENUM.DEJA_ACCOMPAGNE] }] }, 1, 0],
          },
        },
        mineur_contacte_sans_retour: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }] }, 1, 0],
          },
        },
        mineur_coordonnees_incorrectes: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$situation", SITUATION_ENUM.COORDONNEES_INCORRECT] }] }, 1, 0],
          },
        },
        mineur_autre: {
          $sum: {
            $cond: [{ $and: [mineurCondition, { $eq: ["$situation", SITUATION_ENUM.AUTRE] }] }, 1, 0],
          },
        },
        rqth: {
          $sum: {
            $cond: [rqthCondition, 1, 0],
          },
        },
        rqth_a_traiter: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$a_traiter", true] }] }, 1, 0],
          },
        },
        rqth_traite: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$a_traiter", false] }] }, 1, 0],
          },
        },
        rqth_rdv_pris: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$situation", SITUATION_ENUM.RDV_PRIS] }] }, 1, 0],
          },
        },
        rqth_nouveau_projet: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$situation", SITUATION_ENUM.NOUVEAU_PROJET] }] }, 1, 0],
          },
        },
        rqth_deja_accompagne: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$situation", SITUATION_ENUM.DEJA_ACCOMPAGNE] }] }, 1, 0],
          },
        },
        rqth_contacte_sans_retour: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }] }, 1, 0],
          },
        },
        rqth_coordonnees_incorrectes: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$situation", SITUATION_ENUM.COORDONNEES_INCORRECT] }] }, 1, 0],
          },
        },
        rqth_autre: {
          $sum: {
            $cond: [{ $and: [rqthCondition, { $eq: ["$situation", SITUATION_ENUM.AUTRE] }] }, 1, 0],
          },
        },
        abandon: { $sum: { $cond: [{ $eq: ["$current_status.value", "ABANDON"] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        a_traiter: 1,
        traite: 1,
        rdv_pris: 1,
        nouveau_projet: 1,
        deja_accompagne: 1,
        contacte_sans_retour: 1,
        coordonnees_incorrectes: 1,
        autre: 1,
        deja_connu: 1,
        mineur: 1,
        mineur_a_traiter: 1,
        mineur_traite: 1,
        mineur_rdv_pris: 1,
        mineur_nouveau_projet: 1,
        mineur_deja_accompagne: 1,
        mineur_contacte_sans_retour: 1,
        mineur_coordonnees_incorrectes: 1,
        mineur_autre: 1,
        rqth: 1,
        rqth_a_traiter: 1,
        rqth_traite: 1,
        rqth_rdv_pris: 1,
        rqth_nouveau_projet: 1,
        rqth_deja_accompagne: 1,
        rqth_contacte_sans_retour: 1,
        rqth_coordonnees_incorrectes: 1,
        rqth_autre: 1,
        abandon: 1,
      },
    },
  ];

  const data = (await missionLocaleEffectifsDb()
    .aggregate(effectifsMissionLocaleAggregation)
    .next()) as IMissionLocaleStats["stats"];
  if (!data) {
    return {
      total: 0,
      a_traiter: 0,
      traite: 0,
      rdv_pris: 0,
      nouveau_projet: 0,
      deja_accompagne: 0,
      contacte_sans_retour: 0,
      coordonnees_incorrectes: 0,
      autre: 0,
      deja_connu: 0,
      mineur: 0,
      mineur_a_traiter: 0,
      mineur_traite: 0,
      mineur_rdv_pris: 0,
      mineur_nouveau_projet: 0,
      mineur_deja_accompagne: 0,
      mineur_contacte_sans_retour: 0,
      mineur_coordonnees_incorrectes: 0,
      mineur_autre: 0,
      rqth: 0,
      rqth_a_traiter: 0,
      rqth_traite: 0,
      rqth_rdv_pris: 0,
      rqth_nouveau_projet: 0,
      rqth_deja_accompagne: 0,
      rqth_contacte_sans_retour: 0,
      rqth_coordonnees_incorrectes: 0,
      rqth_autre: 0,
      abandon: 0,
    };
  }
  return data;
};

/**
 *
 * Mise a jour des données de la mission locale
 */

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

  await createOrUpdateMissionLocaleStats(missionLocaleId);
  return updated;
};

export const createMissionLocaleSnapshot = async (effectif: IEffectif | IEffectifDECA) => {
  const currentStatus =
    effectif._computed?.statut?.parcours.filter((statut) => statut.date <= new Date()).slice(-1)[0] ||
    effectif._computed?.statut?.parcours.slice(-1)[0];

  const ageFilter = effectif?.apprenant?.date_de_naissance
    ? effectif?.apprenant?.date_de_naissance >= new Date(new Date().setFullYear(new Date().getFullYear() - 26))
    : false;
  const rqthFilter = effectif.apprenant.rqth;
  const rupturantFilter = currentStatus?.valeur === "RUPTURANT";
  const mlFilter = !!effectif.apprenant.adresse?.mission_locale_id;

  const mlData = (await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    ml_id: effectif.apprenant.adresse?.mission_locale_id,
  })) as IOrganisationMissionLocale;

  const date = new Date();

  if (mlData) {
    const mongoInfo = await missionLocaleEffectifsDb().findOneAndUpdate(
      {
        mission_locale_id: mlData?._id,
        effectif_id: effectif._id,
      },
      {
        $set: {
          current_status: {
            value: currentStatus?.valeur,
            date: currentStatus?.date,
          },
        },
        $setOnInsert: {
          effectif_snapshot: { ...effectif, _id: effectif._id },
          effectif_snapshot_date: date,
          date_rupture: currentStatus?.date, // Can only be set if rupturantFilter is RUPTURANT, so current status is rupturant ( check upsert condition )
          created_at: date,
          brevo: {
            token: uuidv4(),
            token_created_at: date,
          },
        },
      },
      { upsert: !!(mlFilter && rupturantFilter && (ageFilter || rqthFilter)) }
    );

    if (mongoInfo.lastErrorObject?.n > 0) {
      createOrUpdateMissionLocaleStats(mlData._id);
    }
  }
};

export const getMissionLocaleStat = async (
  missionLocaleId: ObjectId,
  missionLocaleActivationDate?: Date,
  mineur?: boolean,
  rqth?: boolean
) => {
  const mineurCondition = {
    $gte: [
      "$effectif_snapshot.apprenant.date_de_naissance",
      new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
    ],
  };
  const rqthCondition = { $eq: ["$effectif_snapshot.apprenant.rqth", true] };

  const withCondition = (cond?: any) => {
    if (!mineur && !rqth) {
      return { $sum: cond ? { $cond: [cond, 1, 0] } : 1 };
    }

    const c = {
      $sum: {
        $cond: [
          { $and: [...(cond ? [cond] : []), ...(mineur ? [mineurCondition] : []), ...(rqth ? [rqthCondition] : [])] },
          1,
          0,
        ],
      },
    };
    return c;
  };

  const effectifsMissionLocaleAggregation = [
    generateMissionLocaleMatchStage(missionLocaleId),
    ...EFF_MISSION_LOCALE_FILTER,
    ...filterByDernierStatutPipelineMl(),
    ...addFieldFromActivationDate(missionLocaleActivationDate),
    ...filterByActivationDatePipelineMl(),
    ...addFieldTraitementStatus(),
    {
      $group: {
        _id: null,
        total: withCondition(),
        a_traiter: withCondition({ $eq: ["$a_traiter", true] }),
        traite: withCondition({ $eq: ["$a_traiter", false] }),
        rdv_pris: withCondition({ $eq: ["$situation", SITUATION_ENUM.RDV_PRIS] }),
        nouveau_projet: withCondition({ $eq: ["$situation", SITUATION_ENUM.NOUVEAU_PROJET] }),
        deja_accompagne: withCondition({ $eq: ["$situation", SITUATION_ENUM.DEJA_ACCOMPAGNE] }),
        contacte_sans_retour: withCondition({ $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }),
        coordonnees_incorrectes: withCondition({ $eq: ["$situation", SITUATION_ENUM.COORDONNEES_INCORRECT] }),
        autre: withCondition({ $eq: ["$situation", SITUATION_ENUM.AUTRE] }),
        deja_connu: withCondition({ $eq: ["$deja_connu", true] }),
      },
    },
  ];

  const data = (await missionLocaleEffectifsDb()
    .aggregate(effectifsMissionLocaleAggregation)
    .next()) as IMissionLocaleStats["stats"];
  if (!data) {
    return {
      total: 0,
      a_traiter: 0,
      traite: 0,
      rdv_pris: 0,
      nouveau_projet: 0,
      deja_accompagne: 0,
      contacte_sans_retour: 0,
      coordonnees_incorrectes: 0,
      autre: 0,
      deja_connu: 0,
    };
  }
  return data;
};
