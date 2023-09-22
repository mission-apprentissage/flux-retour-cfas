import Boom from "boom";
import { ObjectId, WithId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

import { LegacyEffectifsFilters, buildMongoPipelineFilterStages } from "@/common/actions/helpers/filters";
import {
  findOrganismesAccessiblesByOrganisationOF,
  findOrganismesFormateursIdsOfOrganisme,
  getOrganismeRestriction,
} from "@/common/actions/helpers/permissions";
import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { getOrganisationOrganisme, listContactsOrganisation } from "@/common/actions/organisations.actions";
import { getMetiersBySiret } from "@/common/apis/apiLba";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb, effectifsDb, organisationsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { OrganisationOrganismeFormation } from "@/common/model/organisations.model";
import { defaultValuesOrganisme } from "@/common/model/organismes.model";
import { getAnneesScolaireListFromDate } from "@/common/utils/anneeScolaireUtils";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import { cleanProjection } from "@/common/utils/mongoUtils";
import { escapeRegExp } from "@/common/utils/regexUtils";
import { getDepartementCodeFromUai } from "@/common/utils/uaiUtils";
import { IReqPostVerifyUser } from "@/common/validation/ApiERPSchema";
import { ConfigurationERP } from "@/common/validation/configurationERPSchema";

import {
  OrganismeWithPermissions,
  PermissionsOrganisme,
  buildOrganismePermissions,
} from "../helpers/permissions-organisme";
import { InfoSiret } from "../infoSiret.actions-struct";

import { getFormationsTreeForOrganisme } from "./organismes.formations.actions";

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 */
export const createOrganisme = async (data: Organisme) => {
  if ((await organismesDb().countDocuments({ uai: data.uai, siret: data.siret })) > 0) {
    throw new Error(`Un organisme avec l'UAI ${data.uai} et le siret ${data.siret} existe déjà`);
  }

  const dataToInsert = {
    ...defaultValuesOrganisme(),
    ...stripEmptyFields(data),
  };
  const { insertedId } = await organismesDb().insertOne(dataToInsert);
  return {
    _id: insertedId,
    ...dataToInsert,
  };
};

/**
 * Fonction de récupération des métiers depuis l'API LBA
 */
const getMetiersFromLba = async (siret: string) => {
  let metiers: any[] = [];

  try {
    metiers = await getMetiersBySiret(siret);
  } catch (error) {
    logger.error(`getMetiersFromLba > Erreur ${error} `);
  }

  return metiers ?? [];
};

/**
 * Fonction de récupération d'informations depuis SIRET via API Entreprise via siret
 */
export const getOrganismeInfosFromSiret = async (siret: string): Promise<Partial<Organisme>> => {
  let organismeInfos: Partial<Organisme> = {};

  if (siret) {
    const dataSiret: InfoSiret = await findDataFromSiret(siret);

    if (dataSiret.messages.api_entreprise_status === "OK") {
      organismeInfos.ferme = !!dataSiret.result.ferme;

      if (dataSiret.result.enseigne) {
        organismeInfos.enseigne = dataSiret.result.enseigne;
        organismeInfos.nom = dataSiret.result.enseigne;
      }

      if (dataSiret.result.raison_sociale) organismeInfos.raison_sociale = dataSiret.result.raison_sociale;

      organismeInfos.adresse = {
        ...(dataSiret.result.numero_voie ? { numero: dataSiret.result.numero_voie } : {}),
        ...(dataSiret.result.voie_complete ? { voie: dataSiret.result.voie_complete } : {}),
        ...(dataSiret.result.complement_adresse ? { complement: dataSiret.result.complement_adresse } : {}),
        ...(dataSiret.result.code_postal ? { code_postal: dataSiret.result.code_postal } : {}),
        ...(dataSiret.result.code_insee_localite ? { code_insee: dataSiret.result.code_insee_localite } : {}),
        ...(dataSiret.result.localite ? { commune: dataSiret.result.localite } : {}),
        ...(dataSiret.result.num_departement ? { departement: dataSiret.result.num_departement as any } : {}),
        ...(dataSiret.result.num_region ? { region: dataSiret.result.num_region as any } : {}),
        ...(dataSiret.result.num_academie ? { academie: dataSiret.result.num_academie as any } : {}),
        ...(dataSiret.result.adresse ? { complete: dataSiret.result.adresse } : {}),
      };
    } else {
      logger.error(`getOrganismeInfosFromSiret > Erreur > ${dataSiret.messages.api_entreprise_info}`);
    }
  }

  return organismeInfos;
};

/**
 * Méthode de récupération d'organismes depuis un siret
 * Previously getFromSiret
 */
export const findOrganismesBySiret = async (siret: string, projection = {}) => {
  return await organismesDb().find({ siret }, { projection }).toArray();
};

/**
 * Méthode de récupération d'un organisme depuis un uai
 * Previously getFromUai
 */
export const findOrganismeByUai = async (uai: string, projection = {}) => {
  if (!uai) {
    throw Error("missing parameter `uai`");
  }
  return await organismesDb().findOne({ uai }, { projection });
};

/**
 * Méthode de récupération d'un organisme depuis un UAI et un SIRET
 */
export const findOrganismeByUaiAndSiret = async (uai?: string, siret?: string, projection = {}) => {
  if (!uai && !siret) {
    throw new Error("missing parameter `uai` or `siret`");
  }
  return await organismesDb().findOne({ uai, siret } as any, { projection });
};

/**
 * Méthode de récupération d'un organisme depuis un id
 */
export const findOrganismeById = async (id: string | ObjectId, projection = {}) => {
  return organismesDb().findOne({ _id: new ObjectId(id) }, { projection });
};

/**
 * Méthode de mise à jour d'un organisme depuis son id
 */
export const updateOrganisme = async (_id: ObjectId, data: Partial<Organisme>) => {
  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: {
        ...organisme,
        ...data,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value as WithId<Organisme>;
};

/**
 * Fonction de MAJ d'un organisme en appelant les API externes
 */
export const updateOrganismeFromApis = async (organisme: WithId<Organisme>) => {
  let updatedData: Partial<Organisme> = {};

  // Récupération des métiers depuis l'API LBA
  const metiers = await getMetiersFromLba(organisme.siret);

  // Construction de l'arbre des formations de l'organisme
  const relatedFormations = (await getFormationsTreeForOrganisme(organisme.uai))?.formations || [];

  // Eventuellement on pourrait récupérer des informations via API Entreprise
  // const organismeInfosFromSiret = await getOrganismeInfosFromSiret(organisme.siret);

  updatedData = {
    metiers,
    relatedFormations,
  };

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    { $set: { ...updatedData, updated_at: new Date() } },
    { returnDocument: "after" }
  );

  return updated.value as WithId<Organisme>;
};

/**
 * Met à jour les dates de transmission d'un organisme.
 * - first_transmission_date : si pas déjà présent
 * - last_transmission_date : dans tous les cas
 */
export const updateOrganismeTransmissionDates = async (
  organisme: Pick<WithId<Organisme>, "_id" | "first_transmission_date">
) => {
  const modifyResult = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: {
        ...(organisme.first_transmission_date ? {} : { first_transmission_date: new Date() }),
        last_transmission_date: new Date(),
        updated_at: new Date(),
      },
    }
  );
  if (!modifyResult.value) {
    throw new Error(`Could not set organisme transmission dates on organisme ${organisme._id.toString()}`);
  }
};

/**
 * Returns sous-établissements by siret for an uai
 */
export const getSousEtablissementsForUai = async (uai: string): Promise<Array<any>> => {
  return await organismesDb()
    .aggregate([
      { $match: { uai, siret: { $ne: null } } },
      { $group: { _id: "$siret", nom: { $first: "$nom" } } },
      { $project: { _id: 0, siret: "$_id", nom: "$nom" } },
    ])
    .toArray();
};

export type OrganismesSearch = {
  searchTerm?: string;
  etablissement_num_region?: string;
  etablissement_num_departement?: string;
  etablissement_reseaux?: string;
};

/**
 * Retourne la liste des organismes correspondant aux critères de recherche
 * restreint aux organismes accessibles par l'utilisateur
 */
export const searchOrganismes = async (ctx: AuthContext, searchCriteria: OrganismesSearch) => {
  const matchStage: any = await getOrganismeRestriction(ctx);
  if (searchCriteria.searchTerm) {
    matchStage.$or = [
      { $text: { $search: searchCriteria.searchTerm } },
      { uai: new RegExp(escapeRegExp(searchCriteria.searchTerm), "g") },
      { siret: new RegExp(escapeRegExp(searchCriteria.searchTerm), "g") },
    ];
  }

  // if other criteria have been provided, find the list of uai matching those criteria in the DossierApprenant collection
  if (
    searchCriteria.etablissement_num_departement ||
    searchCriteria.etablissement_num_region ||
    searchCriteria.etablissement_reseaux
  ) {
    const start = Date.now();
    const eligibleUais = (
      await effectifsDb()
        .aggregate([
          ...buildMongoPipelineFilterStages(searchCriteria as unknown as LegacyEffectifsFilters),
          { $group: { _id: "$_computed.organisme.uai" } },
        ])
        .toArray()
    ).map((row) => row._id);
    logger.info({ elapsted: Date.now() - start, eligibleUais: eligibleUais.length }, "searchOrganismes_eligibleUais");
    matchStage.uai = { $in: eligibleUais };
  }

  const sortStage = searchCriteria.searchTerm
    ? {
        score: { $meta: "textScore" },
        "organisme.nom": 1,
      }
    : { "organisme.nom": 1 };

  const start = Date.now();
  const organismes = await organismesDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
    .toArray();
  logger.info({ elapsted: Date.now() - start, organismes: organismes.length }, "searchOrganismes_organismes");

  return organismes.map((organisme) => {
    return {
      uai: organisme.uai,
      siret: organisme.siret,
      nom: organisme.nom,
      nature: organisme.nature,
      departement: organisme.uai ? getDepartementCodeFromUai(organisme.uai) : null,
    };
  });
};

/**
 * Supprime l'organisme identifié par son id et supprime tous ses effectifs
 */
export const deleteOrganismeAndEffectifs = async (id: ObjectId) => {
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) throw new Error(`Unable to find organisme ${_id.toString()}`);
  if (!organisme.uai) throw new Error(`Organisme ${_id.toString()} doesn't have any UAI`);

  // Suppression des effectifs liés puis de l'organisme
  const { deletedCount: deletedEffectifs } = await effectifsDb().deleteMany({ organisme_id: id });
  const { deletedCount: deletedOrganisme } = await organismesDb().deleteOne({ _id: id });

  return { deletedEffectifs, deletedOrganisme };
};

/**
 * Méthode de récupération de la liste des organismes en base
 */
export const getAllOrganismes = async (
  query = {},
  { page, limit, sort } = { page: 1, limit: 10, sort: { created_at: -1 } as { [key: string]: number } }
) => {
  const result = await organismesDb()
    .aggregate([
      { $match: query },
      { $sort: sort },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();

  if (result?.pagination) {
    result.pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  return result;
};

/**
 * Méthode de récupération d'un organisme et de ses détails depuis son id
 */
export const getDetailedOrganismeById = async (_id: any) => {
  const organisme = await organismesDb()
    .aggregate([
      { $match: { _id: new ObjectId(_id) } },
      // lookup formations
      {
        $lookup: {
          from: "formations",
          localField: "relatedFormations.formation_id",
          foreignField: "_id",
          as: "_tmp_related_formations",
          // lookup are not ordered by default, so we need to sort them manually
          let: { formationIds: "$relatedFormations.formation_id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$formationIds"] },
              },
            },
            {
              $addFields: {
                sort: {
                  $indexOfArray: ["$$formationIds", "$_id"],
                },
              },
            },
            { $sort: { sort: 1 } },
            { $addFields: { sort: "$$REMOVE" } },
          ],
        },
      },
      {
        $addFields: {
          relatedFormations: {
            $map: {
              input: "$relatedFormations",
              as: "formation",
              in: {
                $mergeObjects: [
                  "$$formation",
                  {
                    formation: {
                      $arrayElemAt: [
                        "$_tmp_related_formations",
                        { $indexOfArray: ["$relatedFormations", "$$formation"] },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unset: ["_tmp_related_formations"] },
      // lookup organismesReferentiel
      {
        $lookup: {
          from: "organismesReferentiel",
          as: "organismesReferentiel",
          let: {
            siret: "$siret",
            uai: "$uai",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $gt: ["$siret", null] }, { $eq: ["$siret", "$$siret"] }] },
                    { $and: [{ $gt: ["$uai", null] }, { $eq: ["$uai", "$$uai"] }] },
                  ],
                },
              },
            },
          ],
        },
      },
      // lookup for doublons
      {
        $lookup: {
          from: "organismes",
          as: "organismesDoublon",
          let: {
            id: "$_id",
            siret: "$siret",
            uai: "$uai",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $not: { $eq: ["$_id", "$$id"] } },
                    {
                      $or: [
                        { $and: [{ $gt: ["$siret", null] }, { $eq: ["$siret", "$$siret"] }] },
                        { $and: [{ $gt: ["$uai", null] }, { $eq: ["$uai", "$$uai"] }] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ])
    .next();

  return organisme;
};

/**
 * Met à jour le nombre d'effectifs d'un organisme
 */
export const updateEffectifsCount = async (organisme_id: ObjectId) => {
  const [total, totalCurrentYear] = await Promise.all([
    effectifsDb().countDocuments({ organisme_id }),
    effectifsDb().countDocuments({
      organisme_id,
      annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
    }),
  ]);
  return organismesDb().findOneAndUpdate(
    { _id: organisme_id },
    {
      $set: {
        effectifs_count: total,
        effectifs_current_year_count: totalCurrentYear,
      },
    },
    { bypassDocumentValidation: true }
  );
};

/**
 * Génération d'une api key s'il n'existe pas
 */
export const generateApiKeyForOrg = async (organismeId: ObjectId) => {
  const updated = await organismesDb().findOneAndUpdate(
    { _id: organismeId },
    { $set: { api_key: uuidv4() } },
    { returnDocument: "after" }
  );

  if (!updated.value) {
    throw Boom.notFound(`Organisme ${organismeId} not found`);
  }

  return updated?.value.api_key;
};

/**
 * Méthode de récupération des stats sur la table organisme
 */
export const getStatOrganismes = async () => {
  const stats = await organismesDb()
    .aggregate([
      {
        $group: {
          _id: {
            statut_fiabilisation: "$fiabilisation_statut",
          },
          count: {
            $addToSet: "$_id",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: false,
          statut_fiabilisation: "$_id.statut_fiabilisation",
          count: {
            $size: "$count",
          },
        },
      },
      {
        $sort: {
          statut_fiabilisation: 1,
        },
      },
    ])
    .toArray();

  return stats;
};

export async function getOrganismeById(_id: ObjectId) {
  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw Boom.notFound(`Organisme ${_id} not found`);
  }
  return organisme;
}

/**
 * Retourne les informations d'un organisme avec plus ou moins d'informations selon l'utilisateur authentifié.
 * Les permissions de l'utilisateur authentifié sont également retournées
 */
export async function getOrganismeDetails(ctx: AuthContext, organismeId: ObjectId): Promise<OrganismeWithPermissions> {
  const permissionsOrganisme = await buildOrganismePermissions(ctx, organismeId);
  const organisme = await organismesDb().findOne(
    { _id: organismeId },
    {
      projection: getOrganismeProjection(permissionsOrganisme),
    }
  );
  if (!organisme) {
    throw Boom.notFound(`Organisme ${organismeId} not found`);
  }

  return {
    ...organisme,
    permissions: permissionsOrganisme,
  } as OrganismeWithPermissions;
}

export async function getOrganismeByAPIKey(api_key: string) {
  const organisme = await organismesDb().findOne({ api_key });
  if (!organisme) {
    throw Boom.notFound("Organisme not found");
  }
  return organisme as WithId<Organisme>;
}

export async function findOrganismesBySIRET(siret: string): Promise<Organisme[]> {
  // FIXME projection à définir
  const organismes = await organismesDb()
    .find({
      siret: siret,
    })
    .toArray();
  if (organismes.length === 0) {
    logger.warn({ module: "inscription", siret }, "aucun organisme trouvé en base");
    throw Boom.badRequest("Aucun organisme trouvé");
  }
  return organismes;
}

export async function findOrganismesByUAI(uai: string): Promise<Organisme[]> {
  // FIXME projection à définir
  const organismes = await organismesDb()
    .find({
      uai: uai,
    })
    .toArray();
  if (organismes.length === 0) {
    logger.warn({ module: "inscription", uai }, "aucun organisme trouvé en base");
    throw Boom.badRequest("Aucun organisme trouvé");
  }
  return organismes;
}

export async function getOrganismeByUAIAndSIRET(uai: string | null, siret: string): Promise<Organisme> {
  const organisme = await organismesDb().findOne({
    uai: uai as any,
    siret: siret,
  });
  if (!organisme) {
    throw Boom.badRequest("Aucun organisme trouvé");
  }
  return organisme;
}

async function canConfigureOrganismeERP(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.map((id) => id.toString()).includes(organismeId.toString());
    }

    case "ADMINISTRATEUR":
      return true;

    default:
      return false;
  }
}

export async function configureOrganismeERP(
  ctx: AuthContext,
  organismeId: ObjectId,
  conf: ConfigurationERP
): Promise<void> {
  if (!(await canConfigureOrganismeERP(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
  if (conf.mode_de_transmission === null) {
    await organismesDb().updateOne(
      { _id: new ObjectId(organismeId) },
      {
        $unset: { mode_de_transmission: "" },
      }
    );
  }
  await organismesDb().updateOne({ _id: new ObjectId(organismeId) }, { $set: stripEmptyFields(conf) as any });
}

export async function verifyOrganismeAPIKeyToUser(
  ctx: AuthContext,
  organismeId: ObjectId,
  verif: IReqPostVerifyUser
): Promise<any> {
  if (!(await canConfigureOrganismeERP(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
  const organisme = (await organismesDb().findOne({ _id: organismeId })) as WithId<Organisme>;
  if (!organisme) {
    throw new Error("Aucun organisme trouvé");
  }

  if (organisme.api_key !== verif.api_key) {
    throw Boom.forbidden("Permissions invalides");
  }

  await organismesDb().updateOne(
    { _id: new ObjectId(organismeId) },
    {
      $set: {
        api_uai: verif.uai,
        api_siret: verif.siret,
        api_configuration_date: new Date(),
      },
      $addToSet: {
        erps: verif.erp,
      },
    }
  );

  // if (organisme.siret !== verif.siret && organisme.uai !== verif.uai) {
  //   // TODO WHAT DO WE DO
  //   throw Boom.conflict("Siret/UAI");
  // } else if (organisme.siret !== verif.siret) {
  //   // TODO WHAT DO WE DO
  //   throw Boom.conflict("Siret");
  // } else if (organisme.uai !== verif.uai) {
  //   // TODO WHAT DO WE DO
  //   throw Boom.conflict("UAI");
  // }
}

export async function listContactsOrganisme(organismeId: ObjectId) {
  const organisme = await getOrganismeById(organismeId);
  const organisation = await organisationsDb().findOne({
    siret: organisme.siret,
    uai: organisme.uai as string,
  });
  return organisation ? await listContactsOrganisation(organisation._id) : [];
}

export async function listOrganisationOrganismes(ctx: AuthContext): Promise<WithId<OrganismeWithPermissions>[]> {
  const restrictionOwnOrganisme =
    ctx.organisation.type === "ORGANISME_FORMATION"
      ? {
          _id: {
            $ne: (await getOrganisationOrganisme(ctx))._id,
          },
        }
      : {};
  const organismes = (await organismesDb()
    .find(
      {
        $and: [
          await getOrganismeRestriction(ctx),
          // cas particulier pour l'OF qui ne doit pas lister son propre organisme
          restrictionOwnOrganisme,
        ],
      },
      {
        projection: getOrganismeListProjection(true),
      }
    )
    .toArray()) as WithId<OrganismeWithPermissions>[];

  return organismes;
}

export async function listOrganismesFormateurs(
  ctx: AuthContext,
  organismeId: ObjectId
): Promise<WithId<OrganismeWithPermissions>[]> {
  const organismes = (await organismesDb()
    .find(
      {
        _id: {
          $in: await findOrganismesFormateursIdsOfOrganisme(organismeId),
        },
      },
      {
        projection: getOrganismeListProjection(await getInfoTransmissionEffectifsCondition(ctx)),
      }
    )
    .toArray()) as WithId<OrganismeWithPermissions>[];

  return organismes;
}

async function getInfoTransmissionEffectifsCondition(ctx: AuthContext) {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        $in: ["$_id", linkedOrganismesIds],
      };
    }

    case "TETE_DE_RESEAU": {
      return { $eq: ["$reseaux", organisation.reseau] };
    }

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return true;
  }
}

/**
 * Retourne la projection d'un organisme selon les permissions.
 */
export function getOrganismeProjection(
  permissionsOrganisme: PermissionsOrganisme
): Partial<WithId<OrganismeWithPermissions>> {
  return cleanProjection<Organisme>({
    _id: 1,
    siret: 1,
    uai: 1,
    ferme: 1,
    nature: {
      $ifNull: ["$nature", "inconnue"], // On devrait plutôt remplir automatiquement la nature
    },
    qualiopi: 1,
    prepa_apprentissage: 1,
    enseigne: 1,
    raison_sociale: 1,
    reseaux: 1,
    adresse: 1,
    organismesResponsables: 1,
    organismesFormateurs: 1,
    fiabilisation_statut: 1,
    erps: permissionsOrganisme.infoTransmissionEffectifs,
    first_transmission_date: permissionsOrganisme.infoTransmissionEffectifs,
    last_transmission_date: permissionsOrganisme.infoTransmissionEffectifs,
    mode_de_transmission: permissionsOrganisme.infoTransmissionEffectifs,
    setup_step_courante: permissionsOrganisme.infoTransmissionEffectifs,

    // configuration API
    api_key: permissionsOrganisme.manageEffectifs,
    api_configuration_date: permissionsOrganisme.manageEffectifs,
    api_siret: permissionsOrganisme.manageEffectifs,
    api_uai: permissionsOrganisme.manageEffectifs,
  });
}

/**
 * Retourne la projection d'un organisme utilisé dans une liste selon les permissions.
 */
export function getOrganismeListProjection(
  infoTransmissionEffectifsCondition: any
): Partial<WithId<OrganismeWithPermissions>> {
  return cleanProjection<WithId<OrganismeWithPermissions>>({
    _id: 1,
    siret: 1,
    uai: 1,
    ferme: 1,
    nature: {
      $ifNull: ["$nature", "inconnue"], // On devrait plutôt remplir automatiquement la nature
    },
    qualiopi: 1,
    prepa_apprentissage: 1,
    enseigne: 1,
    raison_sociale: 1,
    reseaux: 1,
    adresse: 1,
    organismesResponsables: 1,
    organismesFormateurs: 1,
    fiabilisation_statut: 1,
    erps: {
      $cond: [infoTransmissionEffectifsCondition, "$erps", undefined],
    },
    first_transmission_date: {
      $cond: [infoTransmissionEffectifsCondition, "$first_transmission_date", undefined],
    },
    last_transmission_date: {
      $cond: [infoTransmissionEffectifsCondition, "$last_transmission_date", undefined],
    },
    permissions: {
      infoTransmissionEffectifs: {
        $cond: [infoTransmissionEffectifsCondition, true, false],
      },
    },
  });
}
