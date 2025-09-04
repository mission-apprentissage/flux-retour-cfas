import { IOrganisationOrganismeFormation } from "shared/models";

import { organisationsDb, organismesDb } from "@/common/model/collections";

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
