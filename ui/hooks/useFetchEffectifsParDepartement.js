import { useQuery } from "@tanstack/react-query";

import { fetchEffectifsParDepartement } from "../common/api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";
import { mapFiltersToApiFormat } from "../common/utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "../common/utils/sortAlphabetically";

const useFetchEffectifsParDepartement = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIF_PAR.DEPARTEMENT, requestFilters], () =>
    fetchEffectifsParDepartement(requestFilters)
  );
  const effectifs = data ? sortAlphabeticallyBy("etablissement_nom_departement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParDepartement;
