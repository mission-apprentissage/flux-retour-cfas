import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";

const useFetchEffectifsParDepartement = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery(["/api/indicateurs/departement", requestFilters], () =>
    _get("/api/indicateurs/departement", { params: requestFilters })
  );
  const effectifs = data ? sortAlphabeticallyBy("etablissement_nom_departement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParDepartement;
