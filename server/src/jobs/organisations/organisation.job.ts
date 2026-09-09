import { ObjectId } from "mongodb";
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

/**
 * Dénormalise sur chaque organisme la présence d'un compte utilisateur confirmé sur son
 * organisation. Alimente le badge « Utilise le Tableau de bord » côté Mission Locale.
 * Calculé pour tous les organismes, indépendamment du flux de collaboration.
 */
export const hydrateOrganismesHasAccount = async () => {
  const organisationIdsAvecCompte = await usersMigrationDb().distinct("organisation_id", {
    account_status: "CONFIRMED",
  });

  const organisations = (await organisationsDb()
    .find({ type: "ORGANISME_FORMATION", _id: { $in: organisationIdsAvecCompte } }, { projection: { organisme_id: 1 } })
    .toArray()) as Array<IOrganisationOrganismeFormation>;

  const organismeIdsAvecCompte = organisations
    .map((orga) => orga.organisme_id)
    .filter((id): id is string => Boolean(id))
    .map((id) => new ObjectId(id));

  const avecCompte = await organismesDb().updateMany(
    { _id: { $in: organismeIdsAvecCompte } },
    { $set: { has_account: true } }
  );
  const sansCompte = await organismesDb().updateMany(
    { _id: { $nin: organismeIdsAvecCompte } },
    { $set: { has_account: false } }
  );

  logger.info(
    `has_account : ${organismeIdsAvecCompte.length} organismes avec compte (${avecCompte.modifiedCount} modifiés), ${sansCompte.modifiedCount} sans compte modifiés`
  );
};
