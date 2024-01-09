import { Filter } from "mongodb";
import { assertUnreachable, entries } from "shared";

import { Organisme } from "@/common/model/@types";

import { TerritoireFilters } from "../../helpers/filters";

export function buildOrganismeMongoFilters(filters: TerritoireFilters): Filter<Organisme> {
  return entries(filters).reduce((acc: Filter<Organisme>, [key, value]) => {
    switch (key) {
      case "organisme_regions":
        acc["adresse.region"] = { $in: value };
        break;
      case "organisme_departements":
        acc["adresse.departement"] = { $in: value };
        break;
      case "organisme_academies":
        acc["adresse.academie"] = { $in: value };
        break;
      case "organisme_bassinsEmploi":
        acc["adresse.bassinEmploi"] = { $in: value };
        break;
      default:
        assertUnreachable(key);
    }

    return acc;
  }, {});
}
