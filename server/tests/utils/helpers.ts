import { ObjectId, WithId } from "mongodb";

import { UsersMigration } from "@/common/model/@types/UsersMigration";
import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { id, testPasswordHash } from "@tests/utils/testUtils";

const date = "2022-10-10T00:00:00.000Z";

export async function createOrganisation(organisationId?: number) {
  return organisationsDb().insertOne({
    _id: new ObjectId(id(organisationId || 1)),
    created_at: new Date(date),
    type: "DREETS",
    code_region: "53",
  });
}

export async function createUser(organisationId?: number, props?: Partial<WithId<UsersMigration>>) {
  const testUser: WithId<UsersMigration> = {
    _id: new ObjectId(id(1)),
    account_status: "CONFIRMED",
    invalided_token: false,
    password_updated_at: new Date(date),
    connection_history: [],
    emails: [],
    created_at: new Date(date),
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    fonction: "Responsable administratif",
    email: "user@example.org",
    telephone: "",
    password: testPasswordHash,
    has_accept_cgu_version: "v0.1",
    organisation_id: new ObjectId(id(organisationId || 1)),
    ...props,
  };
  return usersMigrationDb().insertOne(testUser);
}
