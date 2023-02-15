import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { mapSimpleFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat.js";

const mapIndicateursData = (effectifsData) => ({
  apprentis: effectifsData.apprentis,
  inscritsSansContrat: effectifsData.inscritsSansContrat,
  rupturants: effectifsData.rupturants,
  abandons: effectifsData.abandons,
});

const useFetchIndicateurs = (filtersValues) => {
  const requestFilters = mapSimpleFiltersToApiFormat(filtersValues);

  const { status, data, error } = useQuery(["indicateurs", requestFilters], () =>
    _get("/api/indicateurs", { params: requestFilters })
  );

  const loading = status === "loading";
  const indicateurs = data && mapIndicateursData(data);

  return [indicateurs, loading, error];
};

export default useFetchIndicateurs;
