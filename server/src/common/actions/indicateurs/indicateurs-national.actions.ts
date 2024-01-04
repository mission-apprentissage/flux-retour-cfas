import Boom from "boom";
import { format } from "date-fns";
import { Acl } from "shared";
import { z } from "zod";

import { organismesDb } from "@/common/model/collections";
import { tryCachedExecution } from "@/common/utils/cacheUtils";

import { TerritoireFilters, combineFilters } from "../helpers/filters";

import { getIndicateursEffectifsParDepartement } from "./indicateurs.actions";
import { buildOrganismeMongoFilters } from "./organismes/organismes-filters";

const indicateursNationalCacheExpirationMs = 3600 * 1000; // 1 hour

// SECURITE: Attention aux filtres ajouté ici, la donnée retournée est publique.
export const indicateursNationalFiltersSchema = {
  date: z.preprocess((str: any) => new Date(str ?? Date.now()), z.date()),
  organisme_regions: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type IndicateursNationalFilters = z.infer<z.ZodObject<typeof indicateursNationalFiltersSchema>>;

// On utilise un ACL qui peut accéder à TOUS les indicateurs
// l'accès aux indicateurs est publique si et seulement si les filtres s'opèrent sur les territoirs
const allIndicateurAcl: Acl = {
  viewContacts: false,
  infoTransmissionEffectifs: false,
  indicateursEffectifs: true,
  effectifsNominatifs: {
    apprenant: false,
    apprenti: false,
    inscritSansContrat: false,
    rupturant: false,
    abandon: false,
    inconnu: false,
  },
  manageEffectifs: false,
  configurerModeTransmission: false,
};

export async function getIndicateursNational(filters: IndicateursNationalFilters) {
  const { date, ...territoireFilters } = filters;

  const [indicateursEffectifs, indicateursOrganismes] = await Promise.all([
    tryCachedExecution(
      `indicateurs-national-effectifs:${format(filters.date, "yyyy-MM-dd")}:${filters.organisme_regions?.join(",")}`,
      indicateursNationalCacheExpirationMs,
      async () => getIndicateursEffectifsParDepartement(filters, allIndicateurAcl)
    ),
    tryCachedExecution(
      `indicateurs-national-organismes:${filters.organisme_regions?.join(",")}`,
      indicateursNationalCacheExpirationMs,
      async () => getIndicateursOrganismesNature(territoireFilters)
    ),
  ]);

  return { indicateursEffectifs, indicateursOrganismes };
}

interface IndicateursOrganismesNature {
  total: number;
  totalWithoutTransmissionDate: number;
  responsables: number;
  responsablesFormateurs: number;
  formateurs: number;
}

export async function getIndicateursOrganismesNature(filters: TerritoireFilters): Promise<IndicateursOrganismesNature> {
  const pipeline = [
    {
      $match: combineFilters(...buildOrganismeMongoFilters(filters, true), {
        fiabilisation_statut: "FIABLE",
        ferme: false,
        nature: {
          $nin: ["inconnue", null as any],
        },
      }),
    },
    {
      $facet: {
        withoutTransmissionDate: [
          {
            $count: "total",
          },
        ],
        withTransmissionDate: [
          {
            $match: {
              last_transmission_date: {
                $exists: true,
                $ne: null,
              },
            },
          },
          {
            $project: {
              responsables: { $cond: [{ $eq: [{ $ifNull: ["$nature", ""] }, "responsable"] }, 1, 0] },
              responsablesFormateurs: {
                $cond: [{ $eq: [{ $ifNull: ["$nature", ""] }, "responsable_formateur"] }, 1, 0],
              },
              formateurs: { $cond: [{ $eq: [{ $ifNull: ["$nature", ""] }, "formateur"] }, 1, 0] },
            },
          },
          {
            $group: {
              _id: 0,
              responsables: { $sum: "$responsables" },
              responsablesFormateurs: { $sum: "$responsablesFormateurs" },
              formateurs: { $sum: "$formateurs" },
            },
          },
          {
            $addFields: {
              total: {
                $add: ["$responsables", "$responsablesFormateurs", "$formateurs"],
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$withTransmissionDate",
    },
    {
      $unwind: "$withoutTransmissionDate",
    },
    {
      $project: {
        _id: 0,
        totalWithoutTransmissionDate: "$withoutTransmissionDate.total",
        total: "$withTransmissionDate.total",
        responsables: "$withTransmissionDate.responsables",
        responsablesFormateurs: "$withTransmissionDate.responsablesFormateurs",
        formateurs: "$withTransmissionDate.formateurs",
      },
    },
  ];

  const indicateurs = await organismesDb().aggregate<IndicateursOrganismesNature>(pipeline).next();

  if (indicateurs === null) {
    throw Boom.internal("Unexpected");
  }

  return indicateurs;
}
