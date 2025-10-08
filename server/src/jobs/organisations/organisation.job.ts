import { IOrganisationOrganismeFormation } from "shared/models";

import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import logger from "@/common/logger";
import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";

export const updateOrganismeIdInOrganisations = async () => {
  const organisations: Array<IOrganisationOrganismeFormation> = (await organisationsDb()
    .find({
      type: "ORGANISME_FORMATION",
      organisme_id: { $exists: false },
    })
    .toArray()) as Array<IOrganisationOrganismeFormation>;

  for (let i = 0; i < organisations.length; i++) {
    const orga = organisations[i] as IOrganisationOrganismeFormation;
    const organisme = await organismesDb().findOne({ siret: orga.siret, uai: orga.uai ?? undefined });
    if (organisme) {
      await organisationsDb().updateOne({ _id: orga._id }, { $set: { organisme_id: organisme._id.toString() } });
    }
  }
};

export const deleteOrganisationWithoutUser = async () => {
  let deletionCount = 0;
  const data = await organisationsDb()
    .find({ type: "ORGANISME_FORMATION", ml_beta_activated_at: { $exists: false } })
    .toArray();

  for (const orga of data) {
    const users = await usersMigrationDb().find({ organisation_id: orga._id }).toArray();
    if (users.length === 0) {
      deletionCount++;
      logger.info(`Suppression de l'organisme ${orga._id} car aucun utilisateur n'y est rattaché`);
      await organisationsDb().deleteOne({ _id: orga._id });
    }
  }

  logger.info(`Nombre d'organisations supprimés : ${deletionCount}`);
};

export const createAllMissingOrganismeOrganisation = async () => {
  const organismes = await organismesDb().find({}).toArray();
  for (const organisme of organismes) {
    await getOrganisationOrganismeByOrganismeId(organisme._id);
  }
};
