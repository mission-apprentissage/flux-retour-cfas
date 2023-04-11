import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate } from "../../utils/anneeScolaireUtils.js";

export type EffectifsFilters = {
  date: Date;
  organisme_id?: string;
  formation_cfd?: string;
  etablissement_reseaux?: string;
  etablissement_num_departement?: string;
  etablissement_num_region?: string;
  niveau_formation?: string;
  siret_etablissement?: string;
  uai_etablissement?: string;
};

export type EffectifsFiltersWithRestriction = EffectifsFilters & {
  restrictionMongo?: any; // dirty, en attendant des routes propres
};

export interface FilterConfiguration {
  matchKey: string;

  // optional transformer
  transformValue?: (value: any) => any;
}

export type FilterConfigurations = { [key in keyof EffectifsFilters]: FilterConfiguration };

export const organismeLookup = {
  from: "organismes",
  localField: "organisme_id",
  foreignField: "_id",
  as: "organisme",
};
const filtersConfigurations: FilterConfigurations = {
  date: {
    matchKey: "annee_scolaire",
    transformValue: (date) => ({ $in: getAnneesScolaireListFromDate(date) }),
  },
  organisme_id: {
    matchKey: "organisme_id",
    transformValue: (organismeId) => new ObjectId(organismeId),
  },
  etablissement_num_departement: {
    matchKey: "_computed.organisme.departement",
  },
  etablissement_num_region: {
    matchKey: "_computed.organisme.region",
  },
  etablissement_reseaux: {
    matchKey: "_computed.organisme.reseaux",
  },
  siret_etablissement: {
    matchKey: "_computed.organisme.siret",
  },
  uai_etablissement: {
    matchKey: "_computed.organisme.uai",
  },
  formation_cfd: {
    matchKey: "formation.cfd",
  },
  niveau_formation: {
    matchKey: "formation.niveau",
  },
};

export function buildMongoPipelineFilterStages(filters: EffectifsFiltersWithRestriction) {
  const matchFilters = {};
  for (const [filterName, filterValue] of Object.entries(filters)) {
    const filterConfiguration = filtersConfigurations[filterName];
    if (!filterConfiguration) {
      // allow unknown fields, we only care about those we know
      continue;
    }

    matchFilters[filterConfiguration.matchKey] = filterConfiguration.transformValue?.(filterValue) ?? filterValue;
  }

  // note: empty match stages are noop with MongoDB
  return [
    {
      $match: matchFilters,
    },
    { $match: filters.restrictionMongo ? filters.restrictionMongo : {} },
  ];
}
