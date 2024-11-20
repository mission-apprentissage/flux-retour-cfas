import Boom from "boom";
import { subMonths } from "date-fns";
import type { Request } from "express";
import { ObjectId, WithId } from "mongodb";
import {
  getAnneesScolaireListFromDate,
  Acl,
  PermissionsOrganisme,
  IOrganisationIndicateursOrganismes,
  ORGANISME_INDICATEURS_TYPE,
  IOrganisation,
  IUsersMigration,
} from "shared";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import {
  IOrganisme,
  defaultValuesOrganisme,
  hasRecentTransmissions,
  withOrganismeListSummary,
} from "shared/models/data/organismes.model";
import { v4 as uuidv4 } from "uuid";

import {
  findOrganismesAccessiblesByOrganisationOF,
  findOrganismesFormateursIdsOfOrganisme,
  findOrganismeFormateursIds,
  findOrganismeResponsablesIds,
} from "@/common/actions/helpers/permissions";
import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { listContactsOrganisation } from "@/common/actions/organisations.actions";
import logger from "@/common/logger";
import {
  organismesDb,
  effectifsDb,
  organisationsDb,
  usersMigrationDb,
  effectifsDECADb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import { cleanProjection } from "@/common/utils/mongoUtils";
import { IReqPostVerifyUser } from "@/common/validation/ApiERPSchema";
import { ConfigurationERP } from "@/common/validation/configurationERPSchema";

import { OrganismeWithPermissions, buildOrganismePermissions } from "../helpers/permissions-organisme";
import { buildOrganismePerimetreMongoFilters } from "../indicateurs/organismes/organismes-filters";
import { InfoSiret } from "../infoSiret.actions-struct";

import { getFormationsTreeForOrganisme } from "./organismes.formations.actions";

export type IOrganismeCreate = Partial<
  Pick<
    IOrganisme,
    | "reseaux"
    | "erps"
    | "relatedFormations"
    | "fiabilisation_statut"
    | "ferme"
    | "qualiopi"
    | "prepa_apprentissage"
    | "created_at"
    | "updated_at"
  >
> &
  Omit<
    IOrganisme,
    | "_id"
    | "reseaux"
    | "erps"
    | "relatedFormations"
    | "fiabilisation_statut"
    | "ferme"
    | "qualiopi"
    | "prepa_apprentissage"
    | "created_at"
    | "updated_at"
  >;

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 */
export const createOrganisme = async (data: IOrganismeCreate): Promise<IOrganisme> => {
  if ((await organismesDb().countDocuments({ uai: data.uai, siret: data.siret })) > 0) {
    throw new Error(`Un organisme avec l'UAI ${data.uai} et le siret ${data.siret} existe déjà`);
  }

  const organisme: IOrganisme = {
    _id: new ObjectId(),
    ...defaultValuesOrganisme(),
    ...stripEmptyFields(data),
  };
  await organismesDb().insertOne(organisme);
  return organisme;
};

type OrganismeInfoFromSiret = Pick<IOrganisme, "nom" | "enseigne" | "raison_sociale" | "adresse" | "ferme">;

/**
 * Fonction de récupération d'informations depuis SIRET via API Entreprise via siret
 */
export const getOrganismeInfosFromSiret = async (siret: string): Promise<Partial<OrganismeInfoFromSiret>> => {
  let organismeInfos: Partial<OrganismeInfoFromSiret> = {};

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
export const updateOrganisme = async (_id: ObjectId, data: Partial<IOrganisme>) => {
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

  return updated.value as WithId<IOrganisme>;
};

/**
 * Fonction de MAJ d'un organisme en appelant les API externes
 */
export const updateOneOrganismeRelatedFormations = async (organisme: WithId<IOrganisme>) => {
  // Construction de l'arbre des formations de l'organisme
  const relatedFormations = (await getFormationsTreeForOrganisme(organisme.uai))?.formations || [];

  // Eventuellement on pourrait récupérer des informations via API Entreprise
  // const organismeInfosFromSiret = await getOrganismeInfosFromSiret(organisme.siret);

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    { $set: { relatedFormations, updated_at: new Date() } },
    { returnDocument: "after" }
  );

  return updated.value as WithId<IOrganisme>;
};

/**
 * Met à jour les informations de transmission d'un organisme
 * Dates de transmission :
 * - first_transmission_date : si pas déjà présent
 * - last_transmission_date : dans tous les cas
 * Ajout de la source à la liste des ERPs
 */
export const updateOrganismeTransmission = async (
  organisme: Pick<WithId<IOrganisme>, "_id" | "first_transmission_date">,
  source?: string,
  api_version?: string | null | undefined,
  source_organisme_id?: string | null | undefined
) => {
  const modifyResult = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: {
        ...(organisme.first_transmission_date ? {} : { first_transmission_date: new Date() }),
        last_transmission_date: new Date(),
        ...(api_version ? { api_version } : {}),
        ...(source_organisme_id ? { organisme_transmetteur_id: source_organisme_id } : {}),
        updated_at: new Date(),
      },
      ...(source ? { $addToSet: { erps: source } } : {}),
    }
  );

  if (!modifyResult.value) {
    throw new Error(`Could not set organisme transmission infos on organisme ${organisme._id.toString()}`);
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
 * Supprime l'organisme identifié par son id et supprime tous ses effectifs
 */
export const deleteOrganismeAndEffectifs = async (id: ObjectId) => {
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) throw new Error(`Unable to find organisme ${_id.toString()}`);
  if (!organisme.uai) throw new Error(`IOrganisme ${_id.toString()} doesn't have any UAI`);

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

export const updateOrganismesHasTransmittedWithHierarchy = async (
  organisme: IOrganisme | null,
  forceStatus: boolean = false
) => {
  if (!organisme || (organisme && organisme.is_transmission_target)) {
    return;
  }
  const organismeFormateursIds = findOrganismeFormateursIds(organisme, true);
  const organismeResponsableIds = findOrganismeResponsablesIds(organisme);
  const statusFromCount =
    (await effectifsDb().countDocuments({
      organisme_id: { $in: [organisme._id, ...organismeFormateursIds, ...organismeResponsableIds] },
    })) > 0;

  const computedStatus = statusFromCount || forceStatus;
  await organismesDb().updateMany(
    { _id: { $in: [organisme._id, ...organismeFormateursIds, ...organismeResponsableIds] } },
    {
      $set: {
        is_transmission_target: computedStatus,
      },
    },
    { bypassDocumentValidation: true }
  );
  await effectifsDECADb().updateMany(
    {
      organisme_id: { $in: [organisme._id, ...organismeFormateursIds, ...organismeResponsableIds] },
    },
    {
      $set: {
        is_deca_compatible: !computedStatus,
      },
    },
    { bypassDocumentValidation: true }
  );
};

export const updateDecaCompatibilityFromOrganismeId = async (organismeId: ObjectId, isDecaCompatible: boolean) => {
  await effectifsDECADb().updateMany(
    {
      organisme_id: organismeId,
    },
    {
      $set: {
        is_deca_compatible: isDecaCompatible,
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
    throw Boom.notFound(`IOrganisme ${organismeId} not found`);
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
    throw Boom.notFound(`IOrganisme ${_id} not found`);
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
    throw Boom.notFound(`IOrganisme ${organismeId} not found`);
  }
  const organismesWithAdditionalData = withOrganismeListSummary(organisme);

  return {
    ...organismesWithAdditionalData,
    permissions: permissionsOrganisme,
  } as OrganismeWithPermissions;
}

export async function getOrganismeByAPIKey(api_key: string, queryString: Request["query"]): Promise<IOrganisme> {
  const organisme = await organismesDb().findOne({ api_key });
  if (!organisme) {
    logger.error({ module: "transmission", api_key, queryString }, "Cannot find organisme from api_key");
    throw Boom.forbidden("La clé API n'est pas valide", { queryString });
  }
  return organisme;
}

export async function findOrganismesBySIRET(siret: string): Promise<IOrganisme[]> {
  const organismes = await organismesDb()
    .find(
      {
        siret: siret,
      },
      {
        projection: {
          siret: 1,
          uai: 1,
          enseigne: 1,
          raison_sociale: 1,
          ferme: 1,
          nature: {
            $ifNull: ["$nature", "inconnue"],
          },
          adresse: 1,
        },
      }
    )
    .toArray();
  if (organismes.length === 0) {
    logger.warn({ module: "inscription", siret }, "aucun organisme trouvé en base");
    throw Boom.badRequest("Aucun organisme trouvé");
  }
  return organismes;
}

export async function findOrganismesByUAI(uai: string): Promise<IOrganisme[]> {
  const organismes = await organismesDb()
    .find(
      {
        uai: uai,
      },
      {
        projection: {
          siret: 1,
          uai: 1,
          enseigne: 1,
          raison_sociale: 1,
          ferme: 1,
          nature: {
            $ifNull: ["$nature", "inconnue"],
          },
          adresse: 1,
        },
      }
    )
    .toArray();
  if (organismes.length === 0) {
    logger.warn({ module: "inscription", uai }, "aucun organisme trouvé en base");
    throw Boom.badRequest("Aucun organisme trouvé");
  }
  return organismes;
}

export async function getOrganismeByUAIAndSIRET(uai: string | null, siret: string): Promise<WithId<IOrganisme>> {
  const organisme = await organismesDb().findOne({
    uai: uai as any,
    siret: siret,
  });
  if (!organisme) {
    throw Boom.badRequest("Aucun organisme trouvé");
  }
  return organisme;
}

export async function configureOrganismeERP(
  ctx: AuthContext,
  organismeId: ObjectId,
  conf: ConfigurationERP
): Promise<void> {
  await organismesDb().updateOne(
    { _id: new ObjectId(organismeId) },
    {
      $set: {
        mode_de_transmission: conf.mode_de_transmission,
        erps: conf.erps ?? [],
        ...(conf.erp_unsupported ? { erp_unsupported: conf.erp_unsupported } : {}),
        mode_de_transmission_configuration_date: new Date(),
        mode_de_transmission_configuration_author_fullname: `${ctx.prenom} ${ctx.nom}`,
      },
      $unset: conf.erp_unsupported
        ? {}
        : {
            erp_unsupported: 1,
          },
    }
  );
}

export async function resetConfigurationERP(organismeId: ObjectId): Promise<void> {
  await organismesDb().updateOne(
    { _id: new ObjectId(organismeId) },
    {
      $unset: {
        mode_de_transmission: 1,
        mode_de_transmission_configuration_date: 1,
        mode_de_transmission_configuration_author_fullname: 1,
        erp_unsupported: 1,
        api_configuration_date: 1,
        api_siret: 1,
        api_uai: 1,
        // pas besoin de réinitialiser api_key
      },
      $set: {
        erps: [],
      },
    }
  );

  // reset reminder states
  await usersMigrationDb().updateMany(
    {
      _id: {
        $in: await getMemberIdsOfOrganisme(organismeId),
      },
    },
    {
      $unset: {
        reminder_missing_data_sent_date: 1,
        reminder_missing_configuration_and_data_sent_date: 1,
      },
    }
  );
}

export async function verifyOrganismeAPIKeyToUser(organismeId: ObjectId, verif: IReqPostVerifyUser): Promise<any> {
  const organisme = (await organismesDb().findOne({ _id: organismeId })) as WithId<IOrganisme>;
  if (!organisme) {
    throw Boom.notFound("Aucun organisme trouvé");
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

export async function listOrganisationOrganismes(acl: Acl): Promise<WithId<OrganismeWithPermissions>[]> {
  const organismes = (await organismesDb()
    .find(buildOrganismePerimetreMongoFilters(acl.viewContacts), {
      projection: getOrganismeListProjection(true),
    })
    .toArray()) as WithId<OrganismeWithPermissions>[];

  return organismes;
}

export async function getOrganisationIndicateursOrganismes(acl: Acl): Promise<IOrganisationIndicateursOrganismes> {
  const organismes = (await organismesDb()
    .find(buildOrganismePerimetreMongoFilters(acl.viewContacts), {
      projection: getOrganismeListProjection(true),
    })
    .toArray()) as WithId<OrganismeWithPermissions>[];

  return organismes?.reduce(
    (acc, curr) => {
      return {
        ...acc,
        fiables: acc.fiables + (curr.fiabilisation_statut === "FIABLE" ? 1 : 0),
        organismes: acc.organismes + 1,
        natureInconnue: acc.natureInconnue + (curr.nature === "inconnue" ? 1 : 0),
        uaiNonDeterminee: acc.uaiNonDeterminee + (!curr.uai ? 1 : 0),
        siretFerme: acc.siretFerme + (curr.ferme ? 1 : 0),
        sansTransmissions: acc.sansTransmissions + (hasRecentTransmissions(curr.last_transmission_date) ? 0 : 1),
      };
    },
    {
      organismes: 0,
      fiables: 0,
      sansTransmissions: 0,
      siretFerme: 0,
      natureInconnue: 0,
      uaiNonDeterminee: 0,
    }
  );
}

export async function getOrganisationIndicateursForRelatedOrganismes(acl: Acl, indicateurType: string) {
  const matchIndicateurType: any = {};

  switch (indicateurType) {
    case ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS: {
      const threeMonthsAgo = subMonths(new Date(), 3);
      matchIndicateurType.$or = [
        { last_transmission_date: { $eq: null } },
        {
          $expr: {
            $lt: ["$last_transmission_date", threeMonthsAgo],
          },
        },
      ];
      break;
    }
    case ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE: {
      matchIndicateurType.$or = [
        { nature: { $eq: "inconnue" } },
        { nature: { $eq: null } },
        { nature: { $exists: false } },
      ];
      break;
    }
    case ORGANISME_INDICATEURS_TYPE.SIRET_FERME:
      matchIndicateurType.ferme = { $eq: true };
      break;
    case ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE:
      matchIndicateurType.uai = { $eq: null };
      break;
    default:
      return [];
  }

  const organismes = (await organismesDb()
    .aggregate([
      {
        $match: buildOrganismePerimetreMongoFilters(acl.viewContacts),
      },
      {
        $match: matchIndicateurType,
      },
      {
        $project: getOrganismeListProjection(true),
      },
      {
        $lookup: {
          from: "organisations",
          let: { uai: "$uai", siret: "$siret" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$uai", "$$uai"] }, { $eq: ["$siret", "$$siret"] }],
                },
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "relatedOrganisation",
        },
      },
      {
        $unwind: {
          path: "$relatedOrganisation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "usersMigration",
          let: { orgId: "$relatedOrganisation._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$organisation_id", "$$orgId"] },
                    { $eq: ["$account_status", "CONFIRMED"] },
                    { $ne: ["$has_accept_cgu_version", ""] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                email: 1,
                account_status: 1,
                nom: 1,
                prenom: 1,
                telephone: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "relatedUser",
        },
      },
      {
        $unwind: {
          path: "$relatedUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          relatedOrganisation: { $first: "$relatedOrganisation" },
          relatedUser: { $first: "$relatedUser" },
          organism: { $first: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: "$organism._id",
          siret: "$organism.siret",
          uai: "$organism.uai",
          ferme: "$organism.ferme",
          nature: "$organism.nature",
          qualiopi: "$organism.qualiopi",
          enseigne: "$organism.enseigne",
          raison_sociale: "$organism.raison_sociale",
          adresse: "$organism.adresse",
          formationsCount: "$organism.formationsCount",
          relatedOrganisation: "$relatedOrganisation",
          relatedUser: "$relatedUser",
        },
      },
    ])
    .toArray()) as WithId<
    OrganismeWithPermissions & { relatedOrganisation?: IOrganisation; relatedUser?: IUsersMigration }
  >[];

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
          $in: [organismeId, ...(await findOrganismesFormateursIdsOfOrganisme(organismeId, true))],
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
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(organisation);
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
    case "DRAFPIC":
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
  return cleanProjection<IOrganisme>({
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
    has_transmission_errors: 1,
    transmission_errors_date: 1,
    is_transmission_target: 1,
    last_effectifs_deca_update: 1,
    erps: permissionsOrganisme.infoTransmissionEffectifs,
    erp_unsupported: permissionsOrganisme.infoTransmissionEffectifs,
    first_transmission_date: permissionsOrganisme.infoTransmissionEffectifs,
    last_transmission_date: permissionsOrganisme.infoTransmissionEffectifs,
    mode_de_transmission: permissionsOrganisme.infoTransmissionEffectifs,
    mode_de_transmission_configuration_date: permissionsOrganisme.infoTransmissionEffectifs,
    mode_de_transmission_configuration_author_fullname: permissionsOrganisme.infoTransmissionEffectifs,

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
    formationsCount: {
      $cond: { if: { $isArray: "$relatedFormations" }, then: { $size: "$relatedFormations" }, else: 0 },
    },
    erps: {
      $cond: [infoTransmissionEffectifsCondition, "$erps", undefined],
    },
    erp_unsupported: {
      $cond: [infoTransmissionEffectifsCondition, "$erp_unsupported", undefined],
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

export async function getInvalidUaisFromDossierApprenant(data: Partial<IEffectifQueue>[]): Promise<string[]> {
  const uais = new Set<string>();
  for (const dossier of data) {
    if (dossier.etablissement_formateur_uai) uais.add(dossier.etablissement_formateur_uai);
    if (dossier.etablissement_lieu_de_formation_uai) uais.add(dossier.etablissement_lieu_de_formation_uai);
    if (dossier.etablissement_responsable_uai) uais.add(dossier.etablissement_responsable_uai);
  }
  const invalidsUais: string[] = [];
  for (const uai of uais) {
    const organisme = await organismesDb().findOne({ uai: { $eq: uai } });
    if (!organisme) {
      invalidsUais.push(uai);
    }
  }
  return invalidsUais;
}

export async function getInvalidSiretsFromDossierApprenant(data: Partial<IEffectifQueue>[]): Promise<string[]> {
  const sirets = new Set<string>();
  for (const dossier of data) {
    if (dossier.etablissement_formateur_siret) sirets.add(dossier.etablissement_formateur_siret);
    if (dossier.etablissement_lieu_de_formation_siret) sirets.add(dossier.etablissement_lieu_de_formation_siret);
    if (dossier.etablissement_responsable_siret) sirets.add(dossier.etablissement_responsable_siret);
  }
  const invalidsSirets: string[] = [];
  for (const siret of sirets) {
    const organisme = await organismesDb().findOne({ siret: { $eq: siret } });
    if (!organisme) {
      invalidsSirets.push(siret);
    }
  }
  return invalidsSirets;
}

export async function getMemberIdsOfOrganisme(organismeId: ObjectId): Promise<ObjectId[]> {
  const res = await organismesDb()
    .aggregate<{ _id: ObjectId }>([
      {
        $match: {
          _id: organismeId,
        },
      },
      {
        $project: {
          siret: 1,
          uai: 1,
        },
      },
      {
        $lookup: {
          from: "organisations",
          as: "organisation",
          let: {
            uai: { $ifNull: ["$uai", null] }, // on force par défaut à null plutôt que undefined pour correspondre avec l'organisation
            siret: "$siret",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }],
                },
              },
            },
          ],
        },
      },
      { $unwind: { path: "$organisation" } },
      {
        $lookup: {
          from: "usersMigration",
          as: "users",
          let: {
            organisation_id: "$organisation._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$organisation_id", "$$organisation_id"],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$users",
      },
      {
        $replaceRoot: {
          newRoot: "$users",
        },
      },
    ])
    .toArray();

  return res.map((doc) => doc._id);
}

export const generateOrganismeComputed = (orga: IOrganisme) => {
  const { adresse, uai, siret, reseaux, fiabilisation_statut, ferme } = orga;

  return {
    ...(adresse?.region && { region: adresse?.region }),
    ...(adresse?.departement && { departement: adresse?.departement }),
    ...(adresse?.academie && { academie: adresse?.academie }),
    ...(adresse?.bassinEmploi && { bassinEmploi: adresse?.bassinEmploi }),
    ...(uai && { uai }),
    ...(siret && { siret }),
    ...(reseaux && { reseaux }),
    fiable: fiabilisation_statut === "FIABLE" && !ferme,
  };
};

export const isOrganismeFiable = (orga: IOrganisme) => {
  return orga.fiabilisation_statut === "FIABLE" && !orga.ferme && orga.nature !== "inconnue";
};
