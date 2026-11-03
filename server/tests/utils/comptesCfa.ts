import { ObjectId } from "mongodb";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";

import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { testDoc } from "@tests/utils/testUtils";

export async function insererOrganisationCfa(organismeId: ObjectId, mlBetaActivatedAt?: Date) {
  const _id = new ObjectId();
  await organisationsDb().insertOne(
    testDoc<IOrganisation>({
      _id,
      type: "ORGANISME_FORMATION",
      organisme_id: organismeId.toString(),
      created_at: new Date(),
      ...(mlBetaActivatedAt ? { ml_beta_activated_at: mlBetaActivatedAt } : {}),
    }),
    { bypassDocumentValidation: true }
  );
  return _id;
}

export async function insererCompteCfa(
  organisationId: ObjectId,
  account_status: IUsersMigration["account_status"] = "CONFIRMED"
) {
  await usersMigrationDb().insertOne(
    testDoc<IUsersMigration>({
      email: `${new ObjectId().toHexString()}@cfa.fr`,
      organisation_id: organisationId,
      account_status,
    }),
    { bypassDocumentValidation: true }
  );
}
