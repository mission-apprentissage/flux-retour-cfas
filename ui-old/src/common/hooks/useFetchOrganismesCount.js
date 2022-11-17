import { useQuery } from "react-query";

import { fetchTotalOrganismes } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";
import { pick } from "../utils/pick";

const useFetchOrganismesCount = (filters = {}) => {
  const requestFilters = pick(mapFiltersToApiFormat(filters), [
    "date",
    "etablissement_num_region",
    "etablissement_num_departement",
    "etablissement_reseaux",
    "formation_cfd",
  ]);
  const { data, isLoading } = useQuery([QUERY_KEYS.TOTAL_ORGANISMES, requestFilters], () =>
    fetchTotalOrganismes(requestFilters)
  );

  return { data: data?.nbOrganismes, loading: isLoading };
};

export default useFetchOrganismesCount;
