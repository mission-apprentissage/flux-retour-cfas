import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

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

  const { status, data, error } = useQuery<any, any>(["effectifs", filtersContext.state], () =>
    _get("/api/indicateurs", { params: mapFiltersToApiFormat(filtersContext.state) })
  );

  const loading = status === "loading";
  const effectifs = data && mapEffectifsData(data);

  return [effectifs, loading, error];
};

export default useEffectifs;
