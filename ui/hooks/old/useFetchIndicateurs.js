import { useQuery } from "@tanstack/react-query";

import { useFiltersContext } from "../modules/visualiser-les-indicateurs/FiltersContext";
import { QUERY_KEYS } from "../common/constants/queryKeys";
import { fetchIndicateurs } from "../../common/api/tableauDeBord.js";

const mapEffectifsData = (effectifsData) => {
  return {
    apprentis: effectifsData.apprentis,
    inscritsSansContrat: effectifsData.inscritsSansContrat,
    rupturants: effectifsData.rupturants,
    abandons: effectifsData.abandons,
  };
};

const useFetchIndicateurs = () => {
  const filtersContext = useFiltersContext();
  // TODO [tech] filtersContext add ==> ?organisme_id=${organismeId}
  const { status, data, error } = useQuery([QUERY_KEYS.EFFECTIFS, filtersContext.state], () =>
    fetchIndicateurs(filtersContext.state)
  );

  const loading = status === "loading";
  const effectifs = data && mapEffectifsData(data);

  return [effectifs, loading, error];
};

export default useFetchIndicateurs;
