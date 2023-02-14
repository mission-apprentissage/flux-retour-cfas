import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate } from "../utils/anneeScolaireUtils.js";

export const organismeLookup = {
  from: "organismes",
  localField: "organisme_id",
  foreignField: "_id",
  as: "organisme",
};

/*
interface FilterConfiguration {
  matchKey: string

  // optional transformer
  transformValue?: (value: any) => any

  // some filters need a preliminary lookup with another collection
  preliminaryLookup?: {
    from: string
    localField: string
    foreignField: string
    as: string
  }
}
*/

// {[key: string]: FilterConfiguration}
const filtersConfigurations = {
  date: {
    matchKey: "annee_scolaire",
    transformValue: (date) => ({ $in: getAnneesScolaireListFromDate(date) }),
  },
  organisme_id: {
    matchKey: "organisme_id",
    transformValue: (organismeId) => new ObjectId(organismeId),
  },
  organisme_ids: {
    matchKey: "organisme_id",
    transformValue: (organismeIds) => ({ $in: organismeIds }),
  },
  etablissement_num_departement: {
    matchKey: "organisme.adresse.departement",
    preliminaryLookup: organismeLookup,
  },
  etablissement_num_region: {
    matchKey: "organisme.adresse.region",
    preliminaryLookup: organismeLookup,
  },
};

/**
 * @param {Partial<import("./filters.js").EffectifsFilters>} filters
 */
export function buildMongoPipelineFilterStages(filters = {}) {
  const matchFilters = {};
  const preliminaryLookups = [];
  for (const [filterName, filterValue] of Object.entries(filters)) {
    const filterConfiguration = filtersConfigurations[filterName];
    if (!filterConfiguration) {
      throw new Error(`Missing filter configuration for '${filterName}'`);
    }

    matchFilters[filterConfiguration.matchKey] = filterConfiguration.transformValue?.(filterValue) ?? filterValue;
    if (
      filterConfiguration.preliminaryLookup !== undefined &&
      !preliminaryLookups.includes(filterConfiguration.preliminaryLookup)
    ) {
      preliminaryLookups.push(filterConfiguration.preliminaryLookup);
    }
  }

  return [
    ...preliminaryLookups.map((lookupConf) => ({
      $lookup: lookupConf,
    })),
    {
      $match: matchFilters,
    },
  ];
}
