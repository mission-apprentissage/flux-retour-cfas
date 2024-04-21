import { format } from "date-fns";
import { Acl } from "shared";

import { tryCachedExecution } from "@/common/utils/cacheUtils";

import { DateFilters, TerritoireFilters } from "../helpers/filters";

import { getIndicateursEffectifsParDepartement } from "./indicateurs-with-deca.actions";
import { getIndicateursOrganismesParDepartement } from "./indicateurs.actions";

const indicateursNationalCacheExpirationMs = 3600 * 1000; // 1 hour

// On utilise un ACL qui peut accéder à TOUS les indicateurs
// l'accès aux indicateurs est publique si et seulement si les filtres s'opèrent sur les territoirs
const allIndicateurAcl: Acl = {
  viewContacts: false,
  infoTransmissionEffectifs: true,
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

export async function getIndicateursNational(filters: TerritoireFilters & DateFilters) {
  const cacheKey = Object.keys(filters)
    .toSorted()
    .reduce((acc, key) => {
      if (key === "date") {
        return acc + `:date=${format(filters.date, "yyyy-MM-dd")}`;
      }
      return acc + `:${key}=${filters[key]?.join(",")}`;
    }, "");

  const [indicateursEffectifs, indicateursOrganismes] = await Promise.all([
    tryCachedExecution(`indicateurs-national-effectifs:${cacheKey}`, indicateursNationalCacheExpirationMs, async () =>
      getIndicateursEffectifsParDepartement(filters, allIndicateurAcl)
    ),
    tryCachedExecution(`indicateurs-national-organismes:${cacheKey}`, indicateursNationalCacheExpirationMs, async () =>
      getIndicateursOrganismesParDepartement(filters, allIndicateurAcl)
    ),
  ]);

  return { indicateursEffectifs, indicateursOrganismes };
}
