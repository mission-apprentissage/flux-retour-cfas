import { IMissionLocale } from "api-alternance-sdk";
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
import { IOrganisme, hasRecentTransmissions, withOrganismeListSummary } from "shared/models/data/organismes.model";
import { v4 as uuidv4 } from "uuid";

import {
  findOrganismesAccessiblesByOrganisationOF,
  findOrganismesFormateursIdsOfOrganisme,
  findOrganismeFormateursIds,
  findOrganismeResponsablesIds,
} from "@/common/actions/helpers/permissions";
import { listContactsOrganisation } from "@/common/actions/organisations.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";
import {
  organismesDb,
  effectifsDb,
  organisationsDb,
  usersMigrationDb,
  effectifsDECADb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { cleanProjection } from "@/common/utils/mongoUtils";
import { IReqPostVerifyUser } from "@/common/validation/ApiERPSchema";
import { ConfigurationERP } from "@/common/validation/configurationERPSchema";

import { OrganismeWithPermissions, buildOrganismePermissions } from "../helpers/permissions-organisme";
import { buildOrganismePerimetreMongoFilters } from "../indicateurs/organismes/organismes-filters";
import { listContactsMlOrganisme } from "../mission-locale/mission-locale.actions";

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
    { returnDocument: "after", includeResultMetadata: true }
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
    },
    { includeResultMetadata: true }
  );

  if (source_organisme_id) {
    await organismesDb().findOneAndUpdate(
      { _id: new ObjectId(source_organisme_id) },
      {
        $set: {
          last_erp_transmission_date: new Date(),
          updated_at: new Date(),
        },
      }
    );
  }

  if (!modifyResult.value) {
    throw new Error(`Could not set organisme transmission infos on organisme ${organisme._id.toString()}`);
  }
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
    { bypassDocumentValidation: true, includeResultMetadata: true }
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

/**
 * Génération d'une api key s'il n'existe pas
 */
export const generateApiKeyForOrg = async (organismeId: ObjectId) => {
  const updated = await organismesDb().findOneAndUpdate(
    { _id: organismeId },
    { $set: { api_key: uuidv4() } },
    { returnDocument: "after", includeResultMetadata: true }
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
 * Retourne les informations d'un organisme avec plus ou moins d'informations
 * selon l'utilisateur authentifié. Les permissions de l'utilisateur
 * authentifié sont également retournées.
 *
 * @param ctx Le contexte d'authentification
 * @param organismeId L'identifiant de l'organisme
 * @returns Les détails d'un organisme, les permissions associées et sa mission locale la plus proche
 */
export async function getOrganismeDetails(ctx: AuthContext, organismeId: ObjectId): Promise<OrganismeWithPermissions> {
  try {
    const permissionsOrganisme = await buildOrganismePermissions(ctx, organismeId);

    const organisme = await organismesDb().findOne(
      { _id: organismeId },
      {
        projection: getOrganismeProjection(permissionsOrganisme),
      }
    );

    if (!organisme) {
      throw Boom.notFound(`Aucun organisme trouvé pour l'identifiant ${organismeId}`);
    }

    const organismeAvecDonneesSupplementaires = withOrganismeListSummary(organisme);

    let missionLocaleWithTDBContacts: (IMissionLocale & { contactsTDB: IUsersMigration[] }) | null = null;
    const [longitude, latitude] = organisme.geopoint?.coordinates || [];

    if (typeof longitude === "number" && typeof latitude === "number") {
      const missionsLocalesAPI = await apiAlternanceClient.geographie.listMissionLocales({
        longitude,
        latitude,
        radius: 100,
      });
      if (missionsLocalesAPI.length > 0) {
        const firstMissionLocale = missionsLocalesAPI[0];
        if (typeof firstMissionLocale.id === "number") {
          const missionLocaleContacts = await listContactsMlOrganisme(firstMissionLocale.id);
          missionLocaleWithTDBContacts = {
            ...firstMissionLocale,
            contactsTDB: missionLocaleContacts,
          };
        }
      }
    }

    return {
      ...organismeAvecDonneesSupplementaires,
      permissions: permissionsOrganisme,
      missionLocale: missionLocaleWithTDBContacts,
    } as OrganismeWithPermissions;
  } catch (error) {
    logger.error("Erreur lors de la récupération des détails de l'organisme :", error);
    throw Boom.internal("Une erreur est survenue lors de la récupération des détails de l'organisme");
  }
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

export async function getOrganismeByUAIAndSIRET(uai: string | null, siret: string): Promise<WithId<IOrganisme> | null> {
  return await organismesDb().findOne({
    uai: uai as any,
    siret: siret,
  });
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
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
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
    enseigne: 1,
    raison_sociale: 1,
    reseaux: 1,
    adresse: 1,
    geopoint: 1,
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
function getOrganismeListProjection(
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
    enseigne: 1,
    raison_sociale: 1,
    reseaux: 1,
    adresse: 1,
    organismesResponsables: 1,
    organismesFormateurs: 1,
    fiabilisation_statut: 1,
    formationsCount: "$formations_count",
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
    if (typeof dossier.etablissement_formateur_uai === "string") uais.add(dossier.etablissement_formateur_uai);
    if (typeof dossier.etablissement_responsable_uai === "string") uais.add(dossier.etablissement_responsable_uai);
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
    if (typeof dossier.etablissement_formateur_siret === "string") sirets.add(dossier.etablissement_formateur_siret);
    if (typeof dossier.etablissement_responsable_siret === "string")
      sirets.add(dossier.etablissement_responsable_siret);
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

async function getMemberIdsOfOrganisme(organismeId: ObjectId): Promise<ObjectId[]> {
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
