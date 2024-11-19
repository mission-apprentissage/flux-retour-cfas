import { ObjectId } from "mongodb";
import { IOrganisationOrganismeFormation } from "shared/models/data/organisations.model";
import { IOrganisme } from "shared/models/data/organismes.model";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

/**
 * Liste tous les organismes accessibles pour une organisation (dont l'organisme lié à l'organisation)
 */
export async function findOrganismesAccessiblesByOrganisationOF(
  organisation: IOrganisationOrganismeFormation
): Promise<ObjectId[]> {
  const userOrganisme = await organismesDb().findOne({
    siret: organisation.siret,
    uai: organisation.uai as string,
  });
  if (!userOrganisme) {
    logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
    throw new Error("organisme de l'organisation non trouvé");
  }

  return [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme, true)];
}

export async function findOrganismesFormateursIdsOfOrganisme(
  organismeId: ObjectId,
  withResponsabilitePartielle: boolean
): Promise<ObjectId[]> {
  const organisme = await getOrganismeById(organismeId);
  return findOrganismeFormateursIds(organisme, withResponsabilitePartielle);
}

export function findOrganismeFormateursIds(organisme: IOrganisme, withResponsabilitePartielle: boolean): ObjectId[] {
  return (
    (organisme.organismesFormateurs ?? [])
      // Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef
      .filter((organisme) => !!organisme._id && (withResponsabilitePartielle || !organisme.responsabilitePartielle))
      .map((organisme) => organisme._id as ObjectId)
  );
}

export function findOrganismeResponsablesIds(organisme: IOrganisme): ObjectId[] {
  return (organisme.organismesResponsables ?? [])
    .filter((organisme) => !!organisme._id)
    .map((organisme) => organisme._id as ObjectId);
}
