import { useQuery } from "react-query";

import { fetchEffectifsParDepartement } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

const useFetchEffectifsParDepartement = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIF_PAR.DEPARTEMENT, requestFilters], () =>
    fetchEffectifsParDepartement(requestFilters)
  );
  const effectifs = data ? sortAlphabeticallyBy("etablissement_nom_departement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParDepartement;
