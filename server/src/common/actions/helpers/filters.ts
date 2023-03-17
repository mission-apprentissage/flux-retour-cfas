import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate } from "../../utils/anneeScolaireUtils.js";

export const organismeLookup = {
  from: "organismes",
  localField: "organisme_id",
  foreignField: "_id",
  as: "organisme",
};

/** @type {import("./filters-struct.js").FilterConfigurations} */
const filtersConfigurations = {
  date: {
    matchKey: "annee_scolaire",
    transformValue: (date) => ({ $in: getAnneesScolaireListFromDate(date) }),
  },
  // filter used to ensure access permissions between the user and organismes (if not admin)
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
  etablissement_reseaux: {
    matchKey: "organisme.reseaux",
    preliminaryLookup: organismeLookup,
  },
  siret_etablissement: {
    matchKey: "organisme.siret",
    preliminaryLookup: organismeLookup,
  },
  uai_etablissement: {
    matchKey: "organisme.uai",
    preliminaryLookup: organismeLookup,
  },
  formation_cfd: {
    matchKey: "formation.cfd",
  },
  niveau_formation: {
    matchKey: "formation.niveau",
  },
};

/**
 * @param {Partial<import("./filters-struct.js").EffectifsFilters>} filters
 */
export function buildMongoPipelineFilterStages(filters: any = {}) {
  const matchFilters = {};
  const afterLookupsMatchFilters = {};
  const preliminaryLookups: any[] = [];
  for (const [filterName, filterValue] of Object.entries(filters)) {
    const filterConfiguration = filtersConfigurations[filterName];
    if (!filterConfiguration) {
      // allow unknown fields, we only care about those we know
      continue;
    }

    const targetMatch = filterConfiguration.preliminaryLookup !== undefined ? afterLookupsMatchFilters : matchFilters;
    targetMatch[filterConfiguration.matchKey] = filterConfiguration.transformValue?.(filterValue) ?? filterValue;

    if (
      filterConfiguration.preliminaryLookup !== undefined &&
      !preliminaryLookups.includes(filterConfiguration.preliminaryLookup)
    ) {
      preliminaryLookups.push(filterConfiguration.preliminaryLookup);
    }
  }

  // note: empty match stages are noop with MongoDB
  return [
    ...(filters.organisme_id !== undefined
      ? [
          {
            $match: {
              organisme_id: new ObjectId(filters.organisme_id),
            },
          },
        ]
      : []),
    {
      $match: matchFilters,
    },
    ...preliminaryLookups.map((lookupConf) => ({
      $lookup: lookupConf,
    })),
    {
      $match: afterLookupsMatchFilters,
    },
  ];
}
