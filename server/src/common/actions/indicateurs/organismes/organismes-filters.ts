import Boom from "boom";
import { Filter, ObjectId } from "mongodb";
import { PermissionScope, assertUnreachable, entries } from "shared";
import { IOrganisme } from "shared/models/data/organismes.model";

import { TerritoireFilters } from "../../helpers/filters";

export function buildOrganismePerimetreMongoFilters(perimetre: PermissionScope | boolean): Filter<IOrganisme> {
  if (perimetre === false) {
    throw Boom.forbidden("Accés refusé");
  }

  if (perimetre === true) {
    return {};
  }

  return entries(perimetre).reduce((acc: Filter<IOrganisme>, [key, value]) => {
    switch (key) {
      case "id":
        acc["_id"] = { $in: value.$in.map((v) => new ObjectId(v)) };
        break;
      case "region":
        acc["adresse.region"] = value;
        break;
      case "departement":
        acc["adresse.departement"] = value;
        break;
      case "academie":
        acc["adresse.academie"] = value;
        break;
      case "reseau":
        acc["reseaux"] = value;
        break;
      default:
        assertUnreachable(key);
    }

    return acc;
  }, {});
}
export function buildOrganismeMongoFilters(
  filters: TerritoireFilters,
  perimetre: PermissionScope | boolean
): Filter<IOrganisme>[] {
  const perimetreFilter = buildOrganismePerimetreMongoFilters(perimetre);

  const requestedFilter = entries(filters).reduce((acc: Filter<IOrganisme>, [key, value]) => {
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

  return [requestedFilter, perimetreFilter];
}
