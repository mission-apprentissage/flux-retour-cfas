import { format } from "date-fns";
import { z } from "zod";

import { AuthContext } from "@/common/model/internal/AuthContext";
import { tryCachedExecution } from "@/common/utils/cacheUtils";

import { getIndicateursEffectifsParDepartement, getIndicateursOrganismesParDepartement } from "./indicateurs.actions";

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
        getIndicateursOrganismesParDepartement(ctx, filters),
      ]);
      return { indicateursEffectifs, indicateursOrganismes };
    }
  );
}
