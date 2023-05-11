import { ObjectId } from "mongodb";
import { z } from "zod";

import { getAnneesScolaireListFromDate } from "@/common/utils/anneeScolaireUtils";

// version legacy des filtres indicateurs/effectifs avec organisme_id / siret / uai
// devra être changée avec les nouveaux écrans pour sortir ces paramètres
// qui influencent grandement les vérifications à faire selon le contexte
// (permissions par organisme_id !== permissions par etablissement_reseaux)
export const legacyEffectifsFiltersSchema = {
  date: z.preprocess((str: any) => new Date(str), z.date()),
  organisme_id: z
    .preprocess((v: any) => (ObjectId.isValid(v) ? new ObjectId(v) : v), z.instanceof(ObjectId))
    .optional(),
  formation_cfd: z.string().optional(),
  etablissement_reseaux: z.string().optional(),
  etablissement_num_departement: z.string().optional(),
  etablissement_num_region: z.string().optional(),
  niveau_formation: z.string().optional(),
  siret_etablissement: z.string().optional(),
  uai_etablissement: z.string().optional(),
};

export type LegacyEffectifsFilters = z.infer<z.ZodObject<typeof legacyEffectifsFiltersSchema>>;

export type EffectifsFiltersWithRestriction = LegacyEffectifsFilters & {
  restrictionMongo?: any; // dirty, en attendant des routes propres
};

export interface FilterConfiguration {
  matchKey: string;

  // optional transformer
  transformValue?: (value: any) => any;
}

export type LegacyFilterConfigurations = { [key in keyof LegacyEffectifsFilters]: FilterConfiguration };

export const organismeLookup = {
  from: "organismes",
  localField: "organisme_id",
  foreignField: "_id",
  as: "organisme",
};
const legacyFiltersConfigurations: LegacyFilterConfigurations = {
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
    const filterConfiguration = legacyFiltersConfigurations[filterName];
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

// dashboard simplifié
export const effectifsFiltersSchema = {
  date: z.preprocess((str: any) => new Date(str), z.date()),
  organisme_region: z.string().optional(),
  organisme_departement: z.string().optional(),
};

export type EffectifsFilters = z.infer<z.ZodObject<typeof effectifsFiltersSchema>>;

export const effectifsFiltersConfigurations: { [key in keyof Required<EffectifsFilters>]: FilterConfiguration } = {
  date: {
    matchKey: "annee_scolaire",
    transformValue: (date) => ({ $in: getAnneesScolaireListFromDate(date) }),
  },
  organisme_departement: {
    matchKey: "_computed.organisme.departement",
  },
  organisme_region: {
    matchKey: "_computed.organisme.region",
  },
};

// dashboard simplifié
export const organismesFiltersSchema = {
  organisme_region: z.string().optional(),
  organisme_departement: z.string().optional(),
};

export type OrganismesFilters = z.infer<z.ZodObject<typeof organismesFiltersSchema>>;

export const organismesFiltersConfigurations: { [key in keyof Required<OrganismesFilters>]: FilterConfiguration } = {
  organisme_departement: {
    matchKey: "adresse.departement",
  },
  organisme_region: {
    matchKey: "adresse.region",
  },
};

export function buildMongoFilters<
  Filters extends { [s: string]: any },
  FiltersConfiguration = { [key in keyof Required<OrganismesFilters>]: FilterConfiguration }
>(filters: Filters, filtersConfiguration: FiltersConfiguration): object {
  return Object.entries(filters).reduce((matchFilters, [filterName, filterValue]) => {
    const filterConfiguration = filtersConfiguration[filterName];
    matchFilters[filterConfiguration.matchKey] = filterConfiguration.transformValue?.(filterValue) ?? filterValue;
    return matchFilters;
  }, {});
}
