import { useQuery } from "@tanstack/react-query";

import { fetchIndicateurs } from "../../common/api/tableauDeBord.js";
import { QUERY_KEYS } from "../../common/constants/queryKeys.js";
import { mapSimpleFiltersToApiFormat } from "../../common/utils/mapFiltersToApiFormat.js";

const mapIndicateursData = (effectifsData) => ({
  apprentis: effectifsData.apprentis,
  inscritsSansContrat: effectifsData.inscritsSansContrat,
  rupturants: effectifsData.rupturants,
  abandons: effectifsData.abandons,
});

/**
 * TODO : voir si on laisse dans hooks ou si on move directement dans folder spécifique feature
 * @returns
 */
const useFetchIndicateurs = (filtersValues) => {
  const requestFilters = mapSimpleFiltersToApiFormat(filtersValues);

  const { status, data, error } = useQuery([QUERY_KEYS.INDICATEURS, requestFilters], () =>
    fetchIndicateurs(requestFilters)
  );

  const loading = status === "loading";
  const indicateurs = data && mapIndicateursData(data);

  return [indicateurs, loading, error];
};

export default useFetchIndicateurs;
