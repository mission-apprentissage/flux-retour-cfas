import Boom from "boom";
import { ObjectId } from "bson";
import { MongoServerError } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationMissionLocale, IOrganisationOrganismeFormation } from "shared/models";
import {
  CFA_COLLAB_STATUS,
  CfaEffectifSource,
  ICfaEffectif,
  ICfaEffectifsResponse,
} from "shared/models/routes/organismes/cfa";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { v4 as uuidv4 } from "uuid";

import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import { effectifsDb, effectifsDECADb, missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

interface CfaEffectifsQueryParams {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
  en_rupture?: "oui" | "non";
  collab_status?: string;
  formation?: string;
}

function buildAgeFilter() {
  const now = new Date();
  return [
    {
      $match: {
        "apprenant.date_de_naissance": {
          $lte: new Date(new Date(now).setFullYear(now.getFullYear() - 16)),
        },
      },
    },
  ];
}

/**
 * MongoDB $replaceAll chain to strip French diacritics.
 * Handles NFC/NFD Unicode differences between ERP and DECA sources.
 * Includes UPPERCASE variants because MongoDB $toLower only handles ASCII (A-Z).
 */
function stripDiacritics(expr: Record<string, unknown>) {
  const replacements = [
    ["é", "e"],
    ["è", "e"],
    ["ê", "e"],
    ["ë", "e"],
    ["à", "a"],
    ["â", "a"],
    ["ä", "a"],
    ["ù", "u"],
    ["û", "u"],
    ["ü", "u"],
    ["ô", "o"],
    ["ö", "o"],
    ["î", "i"],
    ["ï", "i"],
    ["ç", "c"],
    ["ÿ", "y"],
    ["É", "e"],
    ["È", "e"],
    ["Ê", "e"],
    ["Ë", "e"],
    ["À", "a"],
    ["Â", "a"],
    ["Ä", "a"],
    ["Ù", "u"],
    ["Û", "u"],
    ["Ü", "u"],
    ["Ô", "o"],
    ["Ö", "o"],
    ["Î", "i"],
    ["Ï", "i"],
    ["Ç", "c"],
    ["Ÿ", "y"],
    ["\u0301", ""],
    ["\u0300", ""],
    ["\u0302", ""],
    ["\u0308", ""],
    ["\u0327", ""],
  ];

  let result: Record<string, unknown> = expr;
  for (const [from, to] of replacements) {
    result = { $replaceAll: { input: result, find: from, replacement: to } };
  }
  return result;
}

function buildCollabStatusSwitch(mlDocField: string) {
  return {
    $switch: {
      branches: [
        {
          case: {
            $and: [
              { $ne: [{ $ifNull: [`${mlDocField}.situation`, null] }, null] },
              { $ne: [`${mlDocField}.situation`, "CONTACTE_SANS_RETOUR"] },
            ],
          },
          then: CFA_COLLAB_STATUS.TRAITE_PAR_ML,
        },
        {
          case: { $eq: [`${mlDocField}.situation`, "CONTACTE_SANS_RETOUR"] },
          then: CFA_COLLAB_STATUS.CONTACTE_PAR_ML,
        },
        {
          case: { $eq: [`${mlDocField}.organisme_data.acc_conjoint`, true] },
          then: CFA_COLLAB_STATUS.COLLAB_DEMANDEE,
        },
      ],
      default: CFA_COLLAB_STATUS.DEMARRER_COLLAB,
    },
  };
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
    case "collab_status":
      return "collab_status";
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
  const anneeScolaireList = getAnneesScolaireListFromDate(new Date());
  const { page, limit, search, sort, order, en_rupture, collab_status, formation } = params;
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

  pipeline.push(...buildAgeFilter());

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
  pipeline.push({
    $addFields: {
      is_plus_25: {
        $and: [
          { $lt: ["$apprenant.date_de_naissance", plus25Cutoff] },
          { $ne: [{ $ifNull: ["$apprenant.rqth", false] }, true] },
        ],
      },
      en_rupture: { $eq: ["$_computed.statut.en_cours", STATUT_APPRENANT.RUPTURANT] },
      date_rupture_computed: {
        $cond: {
          if: { $eq: ["$_computed.statut.en_cours", STATUT_APPRENANT.RUPTURANT] },
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
    {
      $addFields: {
        ml_doc: { $first: "$ml_data" },
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
          $cond: {
            if: {
              $and: [{ $not: ["$en_rupture"] }, { $ifNull: ["$ml_doc.cfa_rupture_declaration.date_rupture", false] }],
            },
            then: "$ml_doc.cfa_rupture_declaration.date_rupture",
            else: "$date_rupture_computed",
          },
        },
      },
    },
    {
      $addFields: {
        collab_status: {
          $cond: {
            if: "$en_rupture",
            then: buildCollabStatusSwitch("$ml_doc"),
            else: null,
          },
        },
      },
    }
  );

  const filterConditions: Record<string, unknown>[] = [];

  if (search) {
    const words = search
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (words.length > 0) {
      const wordConditions = words.map((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: [
            { "apprenant.nom": { $regex: escaped, $options: "i" } },
            { "apprenant.prenom": { $regex: escaped, $options: "i" } },
          ],
        };
      });

      filterConditions.push(wordConditions.length === 1 ? wordConditions[0] : { $and: wordConditions });
    }
  }

  if (en_rupture === "oui") {
    filterConditions.push({ en_rupture: true });
  } else if (en_rupture === "non") {
    filterConditions.push({ en_rupture: false });
  }

  if (collab_status) {
    const statuses = collab_status.split(",").filter(Boolean);
    if (statuses.length > 0) {
      filterConditions.push({ collab_status: { $in: statuses } });
    }
  }

  if (formation) {
    const formations = formation.split(",").filter(Boolean);
    if (formations.length > 0) {
      filterConditions.push({ "formation.libelle_long": { $in: formations } });
    }
  }

  if (filterConditions.length > 0) {
    pipeline.push({ $match: { $and: filterConditions } });
  }

  const sortField = getSortField(sort);
  pipeline.push({
    $facet: {
      total: [{ $count: "count" }],
      effectifs: [
        { $sort: { [sortField]: sortDirection } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            id: "$effectif_id",
            source: "$source_collection",
            nom: "$apprenant.nom",
            prenom: "$apprenant.prenom",
            en_rupture: 1,
            is_plus_25: 1,
            date_rupture: "$date_rupture_computed",
            libelle_formation: "$formation.libelle_long",
            formation_niveau_libelle: { $ifNull: ["$formation.niveau_libelle", null] },
            collab_status: 1,
          },
        },
      ],
      formations: [
        { $match: { "formation.libelle_long": { $exists: true, $ne: null } } },
        { $group: { _id: "$formation.libelle_long" } },
        { $sort: { _id: 1 } },
      ],
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

export async function getCfaEffectifDetail(organismeId: ObjectId, effectifId: string, source?: string) {
  const mlEffectif = await missionLocaleEffectifsDb().findOne({
    effectif_id: new ObjectId(effectifId),
    "effectif_snapshot.organisme_id": organismeId,
    soft_deleted: { $ne: true },
  });

  if (mlEffectif) {
    return { source: "missionLocaleEffectif" as const, data: mlEffectif };
  }

  const db = source === "effectifsDECA" ? effectifsDECADb() : effectifsDb();
  const effectif = await db.findOne({
    _id: new ObjectId(effectifId),
    organisme_id: organismeId,
  });

  if (!effectif) {
    throw Boom.notFound("Effectif not found");
  }

  return { source: (source || "effectifs") as CfaEffectifSource, data: effectif };
}

export async function declareCfaEffectifRupture(
  organismeId: ObjectId,
  effectifId: string,
  source: CfaEffectifSource,
  dateRupture: Date,
  userId: ObjectId
) {
  const db = source === "effectifsDECA" ? effectifsDECADb() : effectifsDb();
  const effectif = await db.findOne({
    _id: new ObjectId(effectifId),
    organisme_id: organismeId,
  });

  if (!effectif) {
    throw Boom.notFound("Effectif non trouvé");
  }

  const declaration = {
    date_rupture: dateRupture,
    declared_at: new Date(),
    declared_by: userId,
  };

  const existing = await missionLocaleEffectifsDb().findOne({
    effectif_id: new ObjectId(effectifId),
    soft_deleted: { $ne: true },
  });

  if (existing) {
    await missionLocaleEffectifsDb().updateOne(
      { _id: existing._id },
      {
        $set: {
          cfa_rupture_declaration: declaration,
          "organisme_data.rupture": true,
          "organisme_data.reponse_at": new Date(),
          updated_at: new Date(),
        },
      }
    );
    return { created: false, updated: true };
  }

  const mlNumericId = effectif.apprenant.adresse?.mission_locale_id;
  if (!mlNumericId) {
    throw Boom.badData("Impossible de déclarer en rupture : zone Mission Locale non identifiée pour cet effectif");
  }

  const mlOrganisation = (await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    ml_id: mlNumericId,
  })) as IOrganisationMissionLocale | null;

  if (!mlOrganisation) {
    throw Boom.badData("Impossible de déclarer en rupture : organisation Mission Locale non trouvée");
  }

  const now = new Date();
  const currentStatus =
    effectif._computed?.statut?.parcours?.filter((s) => s.date <= now).slice(-1)[0] ||
    effectif._computed?.statut?.parcours?.slice(-1)[0];

  const normalizedIdentifiant =
    effectif.apprenant.nom && effectif.apprenant.prenom && effectif.apprenant.date_de_naissance
      ? normalisePersonIdentifiant({
          nom: effectif.apprenant.nom,
          prenom: effectif.apprenant.prenom,
          date_de_naissance: effectif.apprenant.date_de_naissance,
        })
      : undefined;

  const organisation = await getOrganisationOrganismeByOrganismeId(organismeId);

  try {
    await missionLocaleEffectifsDb().insertOne({
      mission_locale_id: mlOrganisation._id,
      effectif_id: new ObjectId(effectifId),
      effectif_snapshot: { ...effectif, _id: effectif._id },
      effectif_snapshot_date: now,
      date_rupture: dateRupture,
      created_at: now,
      current_status: {
        value: currentStatus?.valeur ?? null,
        date: currentStatus?.date ?? null,
      },
      brevo: {
        token: uuidv4(),
        token_created_at: now,
      },
      computed: {
        organisme: {
          ml_beta_activated_at: organisation?.ml_beta_activated_at ?? null,
        },
        ...(mlOrganisation.activated_at ? { mission_locale: { activated_at: mlOrganisation.activated_at } } : {}),
      },
      cfa_rupture_declaration: declaration,
      organisme_data: {
        rupture: true,
        reponse_at: now,
        has_unread_notification: false,
      },
      ...(normalizedIdentifiant ? { identifiant_normalise: normalizedIdentifiant } : {}),
    } as any);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const filter = normalizedIdentifiant
        ? {
            identifiant_normalise: normalizedIdentifiant,
            mission_locale_id: mlOrganisation._id,
            soft_deleted: { $ne: true },
          }
        : { effectif_id: new ObjectId(effectifId), mission_locale_id: mlOrganisation._id };

      await missionLocaleEffectifsDb().updateOne(filter, {
        $set: {
          cfa_rupture_declaration: declaration,
          "organisme_data.rupture": true,
          "organisme_data.reponse_at": now,
          updated_at: now,
        },
      });
      return { created: false, updated: true };
    }
    throw error;
  }

  return { created: true, updated: false };
}
