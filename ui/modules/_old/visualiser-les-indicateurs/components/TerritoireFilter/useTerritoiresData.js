import { useQuery } from "@tanstack/react-query";

import { fetchDepartements, fetchRegions } from "../../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../../common/constants/queryKeys";
import { sortAlphabeticallyBy } from "../../../../common/utils/sortAlphabetically";
import { TERRITOIRE_TYPE } from "./constants";

const useTerritoiresData = () => {
  // departements and regions are very unlikely to change, thus the infinite stale time
  const { data: departements, isLoading: departementsLoading } = useQuery(
    [QUERY_KEYS.DEPARTEMENT],
    () => fetchDepartements(),
    {
      staleTime: Infinity,
    }
  );
  const { data: regions, isLoading: regionsLoading } = useQuery([QUERY_KEYS.REGIONS], () => fetchRegions(), {
    staleTime: Infinity,
  });

  const sortedRegions = sortAlphabeticallyBy("nom", regions || []).map((region) => {
    return { ...region, type: TERRITOIRE_TYPE.REGION };
  });
  const sortedDepartements = sortAlphabeticallyBy("nom", departements || []).map((departement) => {
    return { ...departement, type: TERRITOIRE_TYPE.DEPARTEMENT };
  });
  const isLoading = departementsLoading || regionsLoading;

  return { data: { regions: sortedRegions, departements: sortedDepartements, isLoading } };
};

export default useTerritoiresData;
