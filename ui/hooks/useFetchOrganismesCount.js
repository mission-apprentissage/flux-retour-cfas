import { useQuery } from "@tanstack/react-query";

import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { pick } from "@/common/utils/pick";
import { _get } from "@/common/httpClient";

const useFetchOrganismesCount = (filters = {}) => {
  const requestFilters = pick(mapFiltersToApiFormat(filters), [
    "date",
    "etablissement_num_region",
    "etablissement_num_departement",
    "etablissement_reseaux",
    "formation_cfd",
  ]);
  const { data, isLoading } = useQuery(["total-organismes", requestFilters], () =>
    _get("/api/indicateurs/total-organismes", { params: requestFilters })
  );

  return { data: data?.nbOrganismes, loading: isLoading };
};

export default useFetchOrganismesCount;
