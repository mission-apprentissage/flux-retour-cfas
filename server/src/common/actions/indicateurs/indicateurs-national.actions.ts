import { format } from "date-fns";
import { z } from "zod";

import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { tryCachedExecution } from "@/common/utils/cacheUtils";

import { OrganismesFilters, buildMongoFilters, organismesFiltersConfigurations } from "../helpers/filters";

import { getIndicateursEffectifsParDepartement } from "./indicateurs.actions";

const indicateursNationalCacheExpirationMs = 3600 * 1000; // 1 hour

export const indicateursNationalFiltersSchema = {
  date: z.preprocess((str: any) => new Date(str), z.date()),
  organisme_regions: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type IndicateursNationalFilters = z.infer<z.ZodObject<typeof indicateursNationalFiltersSchema>>;

export async function getIndicateursNational(filters: IndicateursNationalFilters) {
  return await tryCachedExecution(
    `indicateurs-national:${format(filters.date, "yyyy-MM-dd")}:${filters.organisme_regions?.join(",")}`,
    indicateursNationalCacheExpirationMs,
    async () => {
      const ctx = { organisation: { type: "ADMINISTRATEUR" } } as AuthContext; // Hack le temps de refactorer
      const [indicateursEffectifs, indicateursOrganismes] = await Promise.all([
        getIndicateursEffectifsParDepartement(ctx, filters),
        getIndicateursOrganismesNature(filters),
      ]);
      return { indicateursEffectifs, indicateursOrganismes };
    }
  );
}

interface IndicateursOrganismesNature {
  total: number;
  responsables: number;
  responsablesFormateurs: number;
  formateurs: number;
}

export async function getIndicateursOrganismesNature(filters: OrganismesFilters): Promise<IndicateursOrganismesNature> {
  const indicateurs = (await organismesDb()
    .aggregate([
      {
        $match: {
          $and: [
            ...buildMongoFilters(filters, organismesFiltersConfigurations),
            {
              fiabilisation_statut: "FIABLE",
              ferme: false,
            },
          ],
        },
      },
      {
        $project: {
          responsables: { $cond: [{ $eq: [{ $ifNull: ["$nature", ""] }, "responsable"] }, 1, 0] },
          responsablesFormateurs: { $cond: [{ $eq: [{ $ifNull: ["$nature", ""] }, "responsable_formateur"] }, 1, 0] },
          formateurs: { $cond: [{ $eq: [{ $ifNull: ["$nature", ""] }, "formateur"] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: "",
          responsables: { $sum: "$responsables" },
          responsablesFormateurs: { $sum: "$responsablesFormateurs" },
          formateurs: { $sum: "$formateurs" },
        },
      },
      {
        $project: {
          _id: 0,
          total: {
            $add: ["$responsables", "$responsablesFormateurs", "$formateurs"],
          },
          responsables: 1,
          responsablesFormateurs: 1,
          formateurs: 1,
        },
      },
    ])
    .next()) as IndicateursOrganismesNature;
  return indicateurs;
}
