import Boom from "boom";
import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationOrganismeFormation } from "shared/models";
import {
  CFA_EFFECTIF_SITUATION,
  CfaEffectifSource,
  ICfaEffectif,
  ICfaEffectifsResponse,
} from "shared/models/routes/organismes/cfa";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { ensureMissionLocaleEffectifRecord } from "@/common/actions/mission-locale/mission-locale-record.actions";
import { getFamilyOrganismeIds } from "@/common/actions/organismes/organismes.actions";
import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import {
  buildCollabStatusSwitch,
  buildCsvInConditions,
  buildDistinctFacet,
  buildNameSearchConditions,
} from "@/common/actions/shared/rupture-pipeline.utils";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { stripDiacritics } from "@/common/utils/mongoUtils";

interface CfaEffectifsQueryParams {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
  collab_status?: string;
  formation?: string;
}

function getSortField(sort: string): string {
  switch (sort) {
    case "nom":
      return "apprenant.nom";
    case "formation":
      return "formation.libelle_long";
    case "date_rupture":
      return "date_rupture_computed";
    case "en_rupture":
      return "en_rupture";
    case "mission_locale":
      return "mission_locale.nom";
    case "collab_status":
      return "collab_status";
    case "last_activity":
      return "last_activity_at";
    default:
      return "apprenant.nom";
  }
}

export async function getCfaEffectifs(
  organisation: IOrganisationOrganismeFormation,
  isAllowedDeca: boolean,
  params: CfaEffectifsQueryParams
): Promise<ICfaEffectifsResponse> {
  if (!organisation.organisme_id) {
    throw new Error("organisme_id is required");
  }

  const organismeId = new ObjectId(organisation.organisme_id);
  const familyOrganismeIds = await getFamilyOrganismeIds(organismeId);
  const anneeScolaireList = getAnneesScolaireListFromDate(new Date());
  const { page, limit, search, sort, order, collab_status, formation } = params;
  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;

  const baseMatch = {
    organisme_id: organismeId,
    annee_scolaire: { $in: anneeScolaireList },
  };

  const pipeline: Record<string, unknown>[] = [{ $match: baseMatch }];

  if (isAllowedDeca) {
    pipeline.push({
      $unionWith: {
        coll: "effectifsDECA",
        pipeline: [{ $match: baseMatch }],
      },
    });
  }

  pipeline.push(
    {
      $addFields: {
        source_priority: { $cond: [{ $eq: ["$source", "ERP"] }, 0, 1] },
        _dedup_nom: stripDiacritics({ $toLower: { $trim: { input: { $ifNull: ["$apprenant.nom", ""] } } } }),
        _dedup_prenom: stripDiacritics({ $toLower: { $trim: { input: { $ifNull: ["$apprenant.prenom", ""] } } } }),
      },
    },
    { $sort: { source_priority: 1 as const } },
    {
      $group: {
        _id: {
          nom: "$_dedup_nom",
          prenom: "$_dedup_prenom",
          ddn: "$apprenant.date_de_naissance",
        },
        effectif_id: { $first: "$_id" },
        source_collection: {
          $first: {
            $cond: [{ $eq: ["$source", "ERP"] }, "effectifs", "effectifsDECA"],
          },
        },
        doc: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$doc", { effectif_id: "$effectif_id", source_collection: "$source_collection" }],
        },
      },
    }
  );

  const plus25Cutoff = new Date();
  plus25Cutoff.setFullYear(plus25Cutoff.getFullYear() - 25);
  const moins16Cutoff = new Date();
  moins16Cutoff.setFullYear(moins16Cutoff.getFullYear() - 16);
  pipeline.push({
    $addFields: {
      is_plus_25: {
        $and: [
          { $lt: ["$apprenant.date_de_naissance", plus25Cutoff] },
          { $ne: [{ $ifNull: ["$apprenant.rqth", false] }, true] },
        ],
      },
      is_moins_16: { $gt: ["$apprenant.date_de_naissance", moins16Cutoff] },
      en_rupture: { $eq: ["$_computed.statut.en_cours", STATUT_APPRENANT.RUPTURANT] },
      date_rupture_computed: {
        // ABANDON inclus : rupture > 180j toujours pertinente à afficher (sinon date masquée
        // pour les apprentis abandonnés bien qu'ils aient un contrat rupturé).
        $cond: {
          if: {
            $in: ["$_computed.statut.en_cours", [STATUT_APPRENANT.RUPTURANT, STATUT_APPRENANT.ABANDON]],
          },
          then: { $arrayElemAt: ["$contrats.date_rupture", -1] },
          else: null,
        },
      },
    },
  });

  pipeline.push(
    {
      $lookup: {
        from: "missionLocaleEffectif",
        localField: "effectif_id",
        foreignField: "effectif_id",
        as: "ml_data",
        pipeline: [{ $match: { soft_deleted: { $ne: true } } }, { $limit: 1 }],
      },
    },
    // Fallback identifiant scopé famille (rattrape les double-ingestions formateur/responsable).
    // LIMITATION : compare raw apprenant.* vs identifiant_normalise.* — rate si effectif legacy
    // non normalisé (getCfaEffectifDetail normalise JS-side et n'a pas ce problème).
    {
      $lookup: {
        from: "missionLocaleEffectif",
        let: {
          nom: "$apprenant.nom",
          prenom: "$apprenant.prenom",
          dob: "$apprenant.date_de_naissance",
        },
        pipeline: [
          {
            $match: {
              soft_deleted: { $ne: true },
              "effectif_snapshot.organisme_id": { $in: familyOrganismeIds },
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$identifiant_normalise.nom", "$$nom"] },
                  { $eq: ["$identifiant_normalise.prenom", "$$prenom"] },
                  { $eq: ["$identifiant_normalise.date_de_naissance", "$$dob"] },
                ],
              },
            },
          },
          { $sort: { updated_at: -1 } },
          { $limit: 1 },
        ],
        as: "ml_data_by_identifiant",
      },
    },
    {
      $addFields: {
        ml_doc: { $ifNull: [{ $first: "$ml_data" }, { $first: "$ml_data_by_identifiant" }] },
      },
    },
    {
      $addFields: {
        en_rupture: {
          $cond: {
            if: { $ifNull: ["$ml_doc.cfa_rupture_declaration", false] },
            then: true,
            else: "$en_rupture",
          },
        },
        date_rupture_computed: {
          // Priorités : cfa_rupture_declaration > contrat live > ml_doc.date_rupture (snapshot
          // fallback pour les cas où l'effectif live a perdu sa date_rupture, ex. re-ingest).
          $cond: {
            if: {
              $and: [{ $not: ["$en_rupture"] }, { $ifNull: ["$ml_doc.cfa_rupture_declaration.date_rupture", false] }],
            },
            then: "$ml_doc.cfa_rupture_declaration.date_rupture",
            else: { $ifNull: ["$date_rupture_computed", "$ml_doc.date_rupture"] },
          },
        },
      },
    },
    {
      $addFields: {
        collab_status: buildCollabStatusSwitch("$ml_doc"),
        last_activity_at: {
          $max: ["$ml_doc.updated_at", "$ml_doc.created_at", "$ml_doc.organisme_data.reponse_at"],
        },
        has_unread_notification_computed: {
          $ifNull: ["$ml_doc.organisme_data.has_unread_notification", false],
        },
        situation: {
          $switch: {
            branches: [
              { case: "$en_rupture", then: CFA_EFFECTIF_SITUATION.RUPTURE },
              {
                case: { $eq: ["$_computed.statut.en_cours", STATUT_APPRENANT.ABANDON] },
                then: CFA_EFFECTIF_SITUATION.ABANDON,
              },
              {
                case: { $eq: ["$_computed.statut.en_cours", STATUT_APPRENANT.INSCRIT] },
                then: CFA_EFFECTIF_SITUATION.SANS_CONTRAT,
              },
            ],
            default: null,
          },
        },
      },
    }
  );

  const filterConditions: Record<string, unknown>[] = [
    ...buildNameSearchConditions(search, "apprenant.nom", "apprenant.prenom"),
    ...buildCsvInConditions("collab_status", collab_status),
    ...buildCsvInConditions("formation.libelle_long", formation),
  ];

  if (filterConditions.length > 0) {
    pipeline.push({ $match: { $and: filterConditions } });
  }

  // Mission Locale de rattachement : celle du dossier ML si elle existe, sinon celle déduite de
  // l'adresse de l'apprenant. Jointures par égalité (index `_id` et `ml_id`) plutôt que $expr.
  const missionLocaleStages: Record<string, unknown>[] = [
    {
      $lookup: {
        from: "organisations",
        localField: "ml_doc.mission_locale_id",
        foreignField: "_id",
        as: "ml_organisation_by_id",
        pipeline: [{ $project: { _id: 0, nom: 1, commune: { $ifNull: ["$adresse.commune", null] } } }],
      },
    },
    {
      $lookup: {
        from: "organisations",
        localField: "apprenant.adresse.mission_locale_id",
        foreignField: "ml_id",
        as: "ml_organisation_by_adresse",
        pipeline: [
          { $match: { type: "MISSION_LOCALE" } },
          { $project: { _id: 0, nom: 1, commune: { $ifNull: ["$adresse.commune", null] } } },
        ],
      },
    },
    {
      $addFields: {
        mission_locale: {
          $ifNull: [{ $first: "$ml_organisation_by_id" }, { $first: "$ml_organisation_by_adresse" }, null],
        },
      },
    },
  ];

  // Trier sur le nom de la ML impose de résoudre la jointure sur tout l'ensemble filtré ; sinon
  // elle n'est faite que sur la page demandée.
  const sortsOnMissionLocale = sort === "mission_locale";
  if (sortsOnMissionLocale) {
    pipeline.push(...missionLocaleStages);
  }

  const sortField = getSortField(sort);
  const sortStage =
    sort === "last_activity"
      ? { $sort: { has_unread_notification_computed: -1 as const, last_activity_at: sortDirection } }
      : { $sort: { [sortField]: sortDirection } };
  pipeline.push({
    $facet: {
      total: [{ $count: "count" }],
      effectifs: [
        sortStage,
        { $skip: skip },
        { $limit: limit },
        ...(sortsOnMissionLocale ? [] : missionLocaleStages),
        {
          $project: {
            _id: 0,
            id: "$effectif_id",
            source: "$source_collection",
            nom: "$apprenant.nom",
            prenom: "$apprenant.prenom",
            en_rupture: 1,
            is_plus_25: 1,
            is_moins_16: 1,
            date_rupture: "$date_rupture_computed",
            libelle_formation: "$formation.libelle_long",
            formation_niveau_libelle: { $ifNull: ["$formation.niveau_libelle", null] },
            collab_status: 1,
            has_unread_notification: {
              $ifNull: ["$ml_doc.organisme_data.has_unread_notification", false],
            },
            situation: 1,
            mission_locale: 1,
          },
        },
      ],
      formations: buildDistinctFacet("formation.libelle_long"),
    },
  });

  const [result] = await effectifsDb().aggregate(pipeline).toArray();

  const total = result.total[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    effectifs: result.effectifs as ICfaEffectif[],
    pagination: { page, limit, total, totalPages },
    filters: {
      formations: result.formations.map((f: { _id: string }) => f._id),
    },
    isAllowedDeca,
  };
}

async function formatRawEffectif(
  raw: { _id: ObjectId; apprenant?: any; formation?: any; contrats?: any; source?: any; transmitted_at?: any },
  organisme: any
) {
  // Projection alignée sur le $lookup de buildMlAggregation : le front ne doit connaître
  // qu'une seule forme de mission_locale_organisation.
  const missionLocaleOrganisation = raw.apprenant?.adresse?.mission_locale_id
    ? await organisationsDb().findOne(
        { type: "MISSION_LOCALE", ml_id: raw.apprenant.adresse.mission_locale_id },
        {
          projection: {
            _id: 1,
            nom: 1,
            email: 1,
            telephone: 1,
            activated_at: 1,
            adresse: { commune: 1, code_postal: 1 },
          },
        }
      )
    : null;

  return {
    id: raw._id,
    nom: raw.apprenant?.nom,
    prenom: raw.apprenant?.prenom,
    date_de_naissance: raw.apprenant?.date_de_naissance,
    adresse: raw.apprenant?.adresse,
    telephone: raw.apprenant?.telephone,
    courriel: raw.apprenant?.courriel,
    rqth: raw.apprenant?.rqth,
    responsable_mail1: raw.apprenant?.responsable_mail1,
    responsable_mail2: raw.apprenant?.responsable_mail2,
    formation: raw.formation,
    contrats: raw.contrats,
    source: raw.source,
    transmitted_at: raw.transmitted_at,
    a_traiter: false,
    organisme,
    date_rupture: null,
    organisme_data: null,
    mission_locale_organisation: missionLocaleOrganisation,
    mission_locale_logs: [],
  };
}

export async function getCfaEffectifDetail(organismeId: ObjectId, effectifId: string, userId?: ObjectId) {
  const eid = new ObjectId(effectifId);
  const buildMlAggregation = (initialMatch: Record<string, unknown>) => [
    { $match: initialMatch },
    {
      $lookup: {
        from: "organismes",
        let: { id: "$effectif_snapshot.organisme_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          { $project: { nom: 1, raison_sociale: 1, adresse: 1 } },
        ],
        as: "organisme",
      },
    },
    { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "organisations",
        let: { mission_locale_id: "$mission_locale_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$mission_locale_id"] } } },
          {
            $project: {
              _id: 1,
              nom: 1,
              email: 1,
              telephone: 1,
              activated_at: 1,
              adresse: { commune: 1, code_postal: 1 },
            },
          },
        ],
        as: "mission_locale_organisation",
      },
    },
    { $unwind: { path: "$mission_locale_organisation", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "missionLocaleEffectifLog",
        let: { mission_locale_effectif_id: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$mission_locale_effectif_id", "$$mission_locale_effectif_id"] } } },
          { $sort: { created_at: 1 } },
          {
            $lookup: {
              from: "usersMigration",
              let: { created_by_id: "$created_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$created_by_id"] } } },
                { $project: { _id: 0, nom: 1, prenom: 1, email: 1 } },
                { $limit: 1 },
              ],
              as: "created_by_user",
            },
          },
          {
            $addFields: {
              created_by_user: { $arrayElemAt: ["$created_by_user", 0] },
            },
          },
          ...(userId
            ? [
                {
                  $addFields: {
                    unread_by_current_user: {
                      $cond: [{ $not: [{ $in: [userId, { $ifNull: ["$read_by", []] }] }] }, true, false],
                    },
                  },
                },
              ]
            : []),
        ],
        as: "ml_logs",
      },
    },
    {
      $lookup: {
        from: "usersMigration",
        let: { acc_conjoint_by_id: "$organisme_data.acc_conjoint_by" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$acc_conjoint_by_id"] } } },
          { $project: { _id: 0, nom: 1, prenom: 1 } },
          { $limit: 1 },
        ],
        as: "acc_conjoint_by_user_arr",
      },
    },
    {
      $addFields: {
        unread_by_current_user: {
          $eq: ["$organisme_data.has_unread_notification", true],
        },
      },
    },
    {
      $project: {
        id: "$effectif_snapshot._id",
        nom: { $ifNull: ["$identifiant_normalise.nom", "$effectif_snapshot.apprenant.nom"] },
        prenom: { $ifNull: ["$identifiant_normalise.prenom", "$effectif_snapshot.apprenant.prenom"] },
        date_de_naissance: "$effectif_snapshot.apprenant.date_de_naissance",
        adresse: "$effectif_snapshot.apprenant.adresse",
        telephone: "$effectif_snapshot.apprenant.telephone",
        telephone_corrected: "$effectif_choice.telephone",
        courriel: "$effectif_snapshot.apprenant.courriel",
        rqth: "$effectif_snapshot.apprenant.rqth",
        responsable_mail1: "$effectif_snapshot.apprenant.responsable_mail1",
        responsable_mail2: "$effectif_snapshot.apprenant.responsable_mail2",
        formation: "$effectif_snapshot.formation",
        contrats: "$effectif_snapshot.contrats",
        source: "$effectif_snapshot.source",
        transmitted_at: "$effectif_snapshot.transmitted_at",
        a_traiter: { $literal: false },
        "situation.situation": "$situation",
        "situation.situation_autre": "$situation_autre",
        "situation.deja_connu": "$deja_connu",
        "situation.commentaires": "$commentaires",
        injoignable: {
          $cond: [{ $eq: [{ $ifNull: ["$situation", null] }, "CONTACTE_SANS_RETOUR"] }, true, false],
        },
        organisme: "$organisme",
        organisme_data: "$organisme_data",
        cfa_rupture_declaration: "$cfa_rupture_declaration",
        acc_conjoint_by_user: { $arrayElemAt: ["$acc_conjoint_by_user_arr", 0] },
        date_rupture: "$date_rupture",
        mission_locale_organisation: "$mission_locale_organisation",
        mission_locale_logs: "$ml_logs",
        unread_by_current_user: "$unread_by_current_user",
      },
    },
  ];

  const directMatch = {
    effectif_id: eid,
    "effectif_snapshot.organisme_id": organismeId,
    soft_deleted: { $ne: true },
  };
  let mlEffectif = await missionLocaleEffectifsDb().aggregate(buildMlAggregation(directMatch)).next();
  if (mlEffectif) {
    return { effectif: mlEffectif, currentIndex: 0, total: 1 };
  }

  const erpEffectif = await effectifsDb().findOne({ _id: eid, organisme_id: organismeId });
  const decaEffectif = erpEffectif ? null : await effectifsDECADb().findOne({ _id: eid, organisme_id: organismeId });
  const baseEffectif = erpEffectif ?? decaEffectif;

  // Fallback identifiant scopé famille (normalisation JS-side, tolère effectif legacy).
  if (
    baseEffectif &&
    baseEffectif.apprenant?.nom &&
    baseEffectif.apprenant?.prenom &&
    baseEffectif.apprenant?.date_de_naissance
  ) {
    const familyOrganismeIds = await getFamilyOrganismeIds(organismeId);
    const ident = normalisePersonIdentifiant({
      nom: baseEffectif.apprenant.nom,
      prenom: baseEffectif.apprenant.prenom,
      date_de_naissance: baseEffectif.apprenant.date_de_naissance,
    });
    const fallbackMatch = {
      "identifiant_normalise.nom": ident.nom,
      "identifiant_normalise.prenom": ident.prenom,
      "identifiant_normalise.date_de_naissance": ident.date_de_naissance,
      "effectif_snapshot.organisme_id": { $in: familyOrganismeIds },
      soft_deleted: { $ne: true },
    };
    mlEffectif = await missionLocaleEffectifsDb().aggregate(buildMlAggregation(fallbackMatch)).next();
    if (mlEffectif) {
      return { effectif: mlEffectif, currentIndex: 0, total: 1 };
    }
  }

  if (erpEffectif) {
    const organisme = await organismesDb().findOne(
      { _id: erpEffectif.organisme_id },
      { projection: { nom: 1, raison_sociale: 1, adresse: 1 } }
    );
    return { effectif: await formatRawEffectif(erpEffectif, organisme), currentIndex: 0, total: 1 };
  }
  if (decaEffectif) {
    const organisme = await organismesDb().findOne(
      { _id: decaEffectif.organisme_id },
      { projection: { nom: 1, raison_sociale: 1, adresse: 1 } }
    );
    return { effectif: await formatRawEffectif(decaEffectif, organisme), currentIndex: 0, total: 1 };
  }

  throw Boom.notFound("Effectif not found");
}

export async function declareCfaEffectifRupture(
  organismeId: ObjectId,
  effectifId: string,
  source: CfaEffectifSource,
  dateRupture: Date,
  userId: ObjectId
) {
  const now = new Date();
  const declaration = {
    date_rupture: dateRupture,
    declared_at: now,
    declared_by: userId,
  };

  const { created } = await ensureMissionLocaleEffectifRecord(
    organismeId,
    effectifId,
    source,
    {
      cfa_rupture_declaration: declaration,
      "organisme_data.rupture": true,
      "organisme_data.reponse_at": now,
      updated_at: now,
    },
    { dateRupture }
  );

  return created ? { created: true, updated: false } : { created: false, updated: true };
}
