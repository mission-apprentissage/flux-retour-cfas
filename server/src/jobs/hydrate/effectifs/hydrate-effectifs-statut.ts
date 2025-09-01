import { getAnneesScolaireListFromDate } from "shared/utils";

import { hydrateEffectifsComputedTypesGenerique } from "./hydrate-effectifs-computed-types";

export const hydrateWeeklyEffectifStatut = (signal: AbortSignal, evaluationDate = new Date()) => {
  return hydrateEffectifsComputedTypesGenerique(
    {
      query: {
        annee_scolaire: { $in: getAnneesScolaireListFromDate(evaluationDate) },
      },
    },
    signal
  );
};
