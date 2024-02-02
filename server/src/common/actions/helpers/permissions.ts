import { ObjectId } from "mongodb";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { OrganisationOrganismeFormation } from "@/common/model/organisations.model";

/**
 * Liste tous les organismes accessibles pour une organisation (dont l'organisme lié à l'organisation)
 */
export async function findOrganismesAccessiblesByOrganisationOF(
  organisation: OrganisationOrganismeFormation
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

export function findOrganismeFormateursIds(organisme: Organisme, withResponsabilitePartielle: boolean): ObjectId[] {
  return (
    (organisme.organismesFormateurs ?? [])
      // Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef
      .filter((organisme) => !!organisme._id && (withResponsabilitePartielle || !organisme.responsabilitePartielle))
      .map((organisme) => organisme._id as ObjectId)
  );
}
