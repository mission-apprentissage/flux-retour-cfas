import { ObjectId } from "mongodb";

import { organisationsDb, usersMigrationDb } from "../model/collections.js";
import { Organisation } from "../model/organisations.model.js";

export async function createOrganisation(organisation: Organisation): Promise<ObjectId> {
  const { insertedId } = await organisationsDb().insertOne(organisation);
  return insertedId;
}

export async function getOrganisationById(organisationId: string): Promise<Organisation> {
  const organisation = await organisationsDb().findOne<Organisation>({ _id: new ObjectId(organisationId) });
  if (!organisation) {
    throw new Error(`missing organisation ${organisationId}`);
  }
  return organisation;
}

export async function listeOrganisationMembers(organisationId: string): Promise<any[]> {
  const members = await usersMigrationDb()
    .find({
      organisation_id: new ObjectId(organisationId),
    })
    .toArray();
  return members;
}
