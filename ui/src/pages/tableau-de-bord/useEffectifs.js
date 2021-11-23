import { useQuery } from "react-query";

import { fetchEfffectifs } from "../../common/api/tableauDeBord";
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

  const { status, data, error } = useQuery(["effectifs", filtersContext.state], () =>
    fetchEfffectifs(filtersContext.state)
  );

  const loading = status === "loading";
  const effectifs = data && mapEffectifsData(data);

  return [effectifs, loading, error];
};

export default useEffectifs;
