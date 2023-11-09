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

  return [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)];
}

export async function findOrganismesFormateursIdsOfOrganisme(organismeId: ObjectId): Promise<ObjectId[]> {
  const organisme = await getOrganismeById(organismeId);
  return findOrganismeFormateursIds(organisme);
}

export function findOrganismeFormateursIds(organisme: Organisme): ObjectId[] {
  return (organisme.organismesFormateurs ?? [])
    .filter((organisme) => !!organisme._id)
    .map((organisme) => organisme._id as ObjectId);
}
