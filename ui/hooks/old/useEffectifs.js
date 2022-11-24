import { useQuery } from "@tanstack/react-query";

import { useFiltersContext } from "../modules/visualiser-les-indicateurs/FiltersContext";
import { fetchEffectifs } from "../common/api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";

const mapEffectifsData = (effectifsData) => {
  return {
    apprentis: effectifsData.apprentis,
    inscritsSansContrat: effectifsData.inscritsSansContrat,
    rupturants: effectifsData.rupturants,
    abandons: effectifsData.abandons,
  };
};

const useEffectifs = () => {
  const filtersContext = useFiltersContext();
  // TODO [tech] filtersContext add ==> ?organisme_id=${organismeId}
  const { status, data, error } = useQuery([QUERY_KEYS.EFFECTIFS, filtersContext.state], () =>
    fetchEffectifs(filtersContext.state)
  );

  const loading = status === "loading";
  const effectifs = data && mapEffectifsData(data);

  return [effectifs, loading, error];
};

export default useEffectifs;
