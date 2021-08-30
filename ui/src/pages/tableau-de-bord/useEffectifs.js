import qs from "query-string";

import { useFetch } from "../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../common/utils/mapFiltersToApiFormat";
import { useFiltersContext } from "./FiltersContext";

const mapEffectifsData = (effectifsData) => {
  return {
    apprentis: {
      count: effectifsData.apprentis,
    },
    inscritsSansContrat: {
      count: effectifsData.inscritsSansContrat,
    },
    rupturants: {
      count: effectifsData.rupturants,
    },
    abandons: {
      count: effectifsData.abandons,
    },
  };
};

const useEffectifs = () => {
  const filtersContext = useFiltersContext();

  const queryParams = qs.stringify(mapFiltersToApiFormat(filtersContext.state));
  const [data, loading, error] = useFetch(`/api/dashboard/effectifs?${queryParams}`);

  const effectifs = data && mapEffectifsData(data);

  return [effectifs, loading, error];
};

export default useEffectifs;
