import { IOrganisationARML } from "shared/models";

import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  const armls = (await organisationsDb().find({ type: "ARML" }).toArray()) as Array<IOrganisationARML>;

  for (const arml of armls) {
    await organisationsDb().updateMany(
      { type: "MISSION_LOCALE", "adresse.region": { $in: arml.region_list } },
      { $set: { arml_id: arml._id } }
    );
  }
};
