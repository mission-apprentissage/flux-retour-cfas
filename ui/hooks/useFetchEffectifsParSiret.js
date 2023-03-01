import { useQuery } from "@tanstack/react-query";

import { fetchEffectifsParSiret } from "@/common/api/tableauDeBord";
import { QUERY_KEYS } from "@/common/constants/queryKeys";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";

const useFetchEffectifsParSiret = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIF_PAR.SIRET, requestFilters], () =>
    fetchEffectifsParSiret(requestFilters)
  );
  const effectifs = data ? sortAlphabeticallyBy("nom_etablissement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParSiret;
