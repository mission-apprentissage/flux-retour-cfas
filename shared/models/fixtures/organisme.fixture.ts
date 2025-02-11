import { ObjectId } from "mongodb";

import type { IOrganisme } from "../data";

export function generateOrganismeFixture(data?: Partial<IOrganisme>): IOrganisme {
  return {
    _id: new ObjectId(),
    siret: "00000000000018",
    created_at: new Date("2020-01-01T00:00:00.000Z"),
    updated_at: new Date("2021-09-01T00:00:00.000Z"),
    contacts_from_referentiel: [],
    ...data,
  };
}
