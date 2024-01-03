import { format } from "date-fns";
import { z } from "zod";

import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { tryCachedExecution } from "@/common/utils/cacheUtils";

import { TerritoireFilters } from "../helpers/filters";

import { getIndicateursEffectifsParDepartement } from "./indicateurs.actions";
import { buildOrganismeMongoFilters } from "./organismes/organismes-filters";

const indicateursNationalCacheExpirationMs = 3600 * 1000; // 1 hour

export const indicateursNationalFiltersSchema = {
  date: z.preprocess((str: any) => new Date(str ?? Date.now()), z.date()),
  organisme_regions: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type IndicateursNationalFilters = z.infer<z.ZodObject<typeof indicateursNationalFiltersSchema>>;

export async function getIndicateursNational(filters: IndicateursNationalFilters) {
  const { date, ...territoireFilter } = filters;

  return await tryCachedExecution(
    `indicateurs-national:${format(filters.date, "yyyy-MM-dd")}:${filters.organisme_regions?.join(",")}`,
    indicateursNationalCacheExpirationMs,
    async () => {
      const ctx = { organisation: { type: "ADMINISTRATEUR" } } as AuthContext; // Hack le temps de refactorer
      const [indicateursEffectifs, indicateursOrganismes] = await Promise.all([
        getIndicateursEffectifsParDepartement(ctx, filters),
        getIndicateursOrganismesNature(territoireFilter),
      ]);
      return { indicateursEffectifs, indicateursOrganismes };
    }
  );
}

interface IndicateursOrganismesNature {
  total: number;
  totalWithoutTransmissionDate: number;
  responsables: number;
  responsablesFormateurs: number;
  formateurs: number;
}

export async function getIndicateursOrganismesNature(filters: TerritoireFilters): Promise<IndicateursOrganismesNature> {
  const indicateurs = (await organismesDb()
    .aggregate([
      {
        $match: {
          ...buildOrganismeMongoFilters(filters),
          $and: [
            {
              fiabilisation_statut: "FIABLE",
              ferme: false,
              nature: {
                $nin: ["inconnue", null],
              },
            },
          ],
        },
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
    ])
    .next()) as IndicateursOrganismesNature;
  return indicateurs;
}
