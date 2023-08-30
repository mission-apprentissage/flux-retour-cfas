import { subYears } from "date-fns";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { SIRET_REGEX } from "@/common/constants/validations";
import { getAnneesScolaireListFromDate } from "@/common/utils/anneeScolaireUtils";
import { escapeRegExp } from "@/common/utils/regexUtils";
import { isValidUAI } from "@/common/utils/validationUtils";

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

export interface FilterConfiguration {
  matchKey: string;

  // optional transformer
  transformValue?: (value: any) => any;
}

export const organismesFiltersSchema = {
  organisme_regions: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  organisme_academies: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  organisme_bassinsEmploi: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type OrganismesFilters = z.infer<z.ZodObject<typeof organismesFiltersSchema>>;

export const organismesFiltersConfigurations: { [key in keyof Required<OrganismesFilters>]: FilterConfiguration } = {
  organisme_departements: {
    matchKey: "adresse.departement",
    transformValue: (value) => ({ $in: value }),
  },
  organisme_regions: {
    matchKey: "adresse.region",
    transformValue: (value) => ({ $in: value }),
  },
  organisme_academies: {
    matchKey: "adresse.academie",
    transformValue: (value) => ({ $in: value }),
  },
  organisme_bassinsEmploi: {
    matchKey: "adresse.bassinEmploi",
    transformValue: (value) => ({ $in: value }),
  },
};

export const effectifsFiltersSchema = {
  ...organismesFiltersSchema,
  date: z.preprocess((str: any) => new Date(str), z.date()),
};

export type EffectifsFilters = z.infer<z.ZodObject<typeof effectifsFiltersSchema>>;

export const effectifsFiltersConfigurations: { [key in keyof Required<EffectifsFilters>]: FilterConfiguration } = {
  date: {
    matchKey: "annee_scolaire",
    transformValue: (value) => ({ $in: getAnneesScolaireListFromDate(value) }),
  },
  organisme_departements: {
    matchKey: "_computed.organisme.departement",
    transformValue: (value) => ({ $in: value }),
  },
  organisme_regions: {
    matchKey: "_computed.organisme.region",
    transformValue: (value) => ({ $in: value }),
  },
  organisme_academies: {
    matchKey: "_computed.organisme.academie",
    transformValue: (value) => ({ $in: value }),
  },
  organisme_bassinsEmploi: {
    matchKey: "_computed.organisme.bassinEmploi",
    transformValue: (value) => ({ $in: value }),
  },
};

// [min, max[
const intervalParTrancheAge = {
  "-18": [0, 18],
  "18-20": [18, 21],
  "21-25": [21, 26],
  "26+": [26, 999],
};

/**
 * Utilisé pour la recherche détaillée des indicateurs effectifs
 */
export const fullEffectifsFiltersSchema = {
  ...effectifsFiltersSchema,
  organisme_search: z.string().optional(),
  organisme_reseaux: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  // apprenant_genre: z.string(),
  apprenant_tranchesAge: z
    .preprocess(
      (str: any) => str.split(","),
      z.array(z.enum(Object.keys(intervalParTrancheAge) as [string, ...string[]]))
    )
    .optional(),
  // apprenant_rqth: z.boolean().optional(),
  formation_annees: z
    .preprocess((str: any) => str.split(",").map((i) => parseInt(i, 10)), z.array(z.number()))
    .optional(),
  formation_niveaux: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  formation_cfds: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  formation_secteursProfessionnels: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type FullEffectifsFilters = z.infer<z.ZodObject<typeof fullEffectifsFiltersSchema>>;

export const fullEffectifsFiltersConfigurations: {
  [key in keyof Required<FullEffectifsFilters>]: FilterConfiguration;
} = {
  ...effectifsFiltersConfigurations,
  organisme_search: {
    matchKey: "$or",
    transformValue: (value) => {
      if (isValidUAI(value)) {
        return [{ "_computed.organisme.uai": value }];
      }
      if (SIRET_REGEX.test(value)) {
        return [{ "_computed.organisme.siret": value }];
      }
      if (/^\d{3,}$/.test(value)) {
        return [{ "_computed.organisme.siret": new RegExp(escapeRegExp(value)) }];
      }
      return [{ "_computed.organisme.nom": new RegExp(escapeRegExp(value)) }]; // FIXME rapatrier le nom (enseigne/raison_sociale) de l'organisme
    },
  },
  organisme_reseaux: {
    matchKey: "_computed.organisme.reseaux",
    transformValue: (value) => ({ $in: value }),
  },

  // apprenant_genre: {
  //   matchKey: "", // encore inconnu, INE ou civilité avec api v3 ?
  // },
  apprenant_tranchesAge: {
    matchKey: "$or",
    transformValue: (keys) =>
      keys.map((key) => {
        const [min, max] = intervalParTrancheAge[key];
        return {
          "apprenant.date_de_naissance": {
            $lt: subYears(new Date(), min),
            $gte: subYears(new Date(), max),
          },
        };
      }),
  },
  // apprenant_rqth: {
  //   matchKey: "", // inconnu
  // },

  formation_annees: {
    matchKey: "formation.annee",
    transformValue: (value) => ({ $in: value }),
  },
  formation_niveaux: {
    matchKey: "formation.niveau",
    transformValue: (value) => ({ $in: value }),
  },
  formation_cfds: {
    matchKey: "formation.cfd",
    transformValue: (value) => ({ $in: value }),
  },
  formation_secteursProfessionnels: {
    matchKey: "_computed.formation.codes_rome",
    transformValue: (value) => ({ $in: value }),
  },
};

export function buildMongoFilters<
  Filters extends { [s: string]: any },
  FiltersConfiguration = { [key in keyof Required<OrganismesFilters>]: FilterConfiguration }
>(filters: Filters, filtersConfiguration: FiltersConfiguration): any[] {
  return Object.entries(filters).reduce((matchFilters, [filterName, filterValue]) => {
    const filterConfiguration = filtersConfiguration[filterName];
    if (!filterConfiguration) {
      return matchFilters;
    }
    return [
      ...matchFilters,
      {
        [filterConfiguration.matchKey]: filterConfiguration.transformValue?.(filterValue) ?? filterValue,
      },
    ];
  }, [] as any[]);
}
