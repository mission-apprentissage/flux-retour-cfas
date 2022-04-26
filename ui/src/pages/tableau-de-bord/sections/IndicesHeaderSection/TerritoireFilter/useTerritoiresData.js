import { useQuery } from "react-query";

import { fetchDepartements, fetchRegions } from "../../../../../common/api/tableauDeBord";
import { sortAlphabeticallyBy } from "../../../../../common/utils/sortAlphabetically";

const useTerritoiresData = () => {
  // departements and regions are very unlikely to change, thus the infinite stale time
  const { data: departements, isLoading: departementsLoading } = useQuery("departement", () => fetchDepartements(), {
    staleTime: Infinity,
  });
  const { data: regions, isLoading: regionsLoading } = useQuery("regions", () => fetchRegions(), {
    staleTime: Infinity,
  });

  const sortedRegions = sortAlphabeticallyBy("nom", regions || []).map((region) => {
    return { ...region, type: "region" };
  });
  const sortedDepartements = sortAlphabeticallyBy("nom", departements || []).map((departement) => {
    return { ...departement, type: "departement" };
  });
  const isLoading = departementsLoading || regionsLoading;

  return { data: { regions: sortedRegions, departements: sortedDepartements, isLoading } };
};

export default useTerritoiresData;
