import qs from "query-string";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { useFiltersContext } from "../../FiltersContext";

export const useFetchChiffresCles = ([startDate, endDate]) => {
  const { state: filters } = useFiltersContext();
  const queryParams = qs.stringify({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...pick(mapFiltersToApiFormat(filters), [
      "formation_cfd",
      "uai_etablissement",
      "etablissement_num_region",
      "etablissement_num_departement",
      "etablissement_reseaux",
    ]),
  });

  return useFetch(`/api/dashboard/chiffres-cles?${queryParams}`);
};
